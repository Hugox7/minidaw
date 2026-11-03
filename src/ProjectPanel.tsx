import {tr, localeTag} from './i18n';
import { useEffect, useRef, useState } from 'react';
import type { Project } from './types';
import { exportProjectAudio } from './exportAudio';
import { stopPlayback } from './audio';
import { getAudioBlob, restoreProjectAssets } from './audioAssets';
import { decodeProject, encodeProject, projectFilename } from './projectFile';
import { chooseDirectory, chooseSaveFile, directorySupported, listProjectFiles, newProjectFile, recallDirectory, rememberDirectory, savePickerSupported, writeProjectFile } from './projectDirectory';
import type { ProjectDirectoryHandle, ProjectFileHandle } from './projectDirectory';
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
export default function ProjectPanel({ project, disabled, onName, onLoad, onNew, onWorking }: {
    project: Project;
    disabled: boolean;
    onName: (name: string) => void;
    onLoad: (project: Project) => void;
    onNew: () => void;
    onWorking: (busy: boolean) => void;
}) {
    const [directory, setDirectory] = useState<ProjectDirectoryHandle | null>(null), [accessible, setAccessible] = useState(false), [files, setFiles] = useState<Awaited<ReturnType<typeof listProjectFiles>>>([]);
    const [fileHandle, setFileHandle] = useState<ProjectFileHandle | null>(null), [filename, setFilename] = useState(''), [baseline, setBaseline] = useState(''), [status, setStatus] = useState(tr("Copie de travail conserv\u00E9e dans ce navigateur.")), [error, setError] = useState(''), [working, setWorking] = useState(false);
    const [exportMessage, setExportMessage] = useState('');
    const input = useRef<HTMLInputElement>(null), generation = useRef(0);
    const locked = disabled || working, dirty = Boolean(baseline && baseline !== JSON.stringify(project));
    useEffect(() => {
        let cancelled = false;
        const request = generation.current;
        if (directorySupported())
            void recallDirectory().then(async (handle) => {
                if (!handle || cancelled || generation.current !== request)
                    return;
                const allowed = await handle.queryPermission({ mode: 'readwrite' }) === 'granted';
                const found = allowed ? await listProjectFiles(handle) : [];
                if (!cancelled && generation.current === request) {
                    setDirectory(handle);
                    setAccessible(allowed);
                    setFiles(found);
                }
            }).catch(() => { });
        return () => { cancelled = true; };
    }, []);
    async function run(action: () => Promise<void>) {
        if (locked)
            return;
        setWorking(true);
        onWorking(true);
        setError('');
        try {
            await action();
        }
        catch (value) {
            if (value instanceof Error && value.name === 'AbortError')
                setStatus(tr("Op\u00E9ration annul\u00E9e. Le projet reste ouvert."));
            else {
                setError(value instanceof Error && value.name === 'NotAllowedError' ? tr("Acc\u00E8s au fichier refus\u00E9. R\u00E9autorise le dossier ou enregistre une copie.") : value instanceof Error ? value.message : String(value));
                if (value instanceof Error && value.name === 'NotAllowedError')
                    setAccessible(false);
            }
        }
        finally {
            setWorking(false);
            onWorking(false);
        }
    }
    function mayReplace() { if (baseline && !dirty)
        return true; return confirm(tr("Ouvrir ou cr\u00E9er un autre projet remplacera la copie de travail actuelle dans ce navigateur. Enregistre ton morceau avant de continuer si tu veux le conserver. Continuer ?")); }
    async function open(file: File, handle: ProjectFileHandle | null) {
        setStatus(tr("V\u00E9rification du projet et de ses prises\u2026"));
        const packed = await decodeProject(file);
        if (!mayReplace()) {
            setStatus(tr("Ouverture annul\u00E9e. Le projet reste ouvert."));
            return;
        }
        const next = await restoreProjectAssets(packed.project, packed.assets);
        onLoad(next);
        setFileHandle(handle);
        setFilename(file.name);
        setBaseline(JSON.stringify(next));
        setStatus(tr("Projet charg\u00E9 avec ses prises audio."));
    }
    async function save(copy = false) {
        const snapshot = project;
        let handle = copy ? null : fileHandle;
        // Native pickers must run before asynchronous packing while the click is active.
        if (!handle && !directory && savePickerSupported())
            handle = await chooseSaveFile(projectFilename(snapshot.name + (copy ? tr(' - copie') : '')));
        if (directory && !handle && !accessible && await directory.requestPermission({ mode: 'readwrite' }) !== 'granted')
            throw new Error(tr("Autorise l\u2019acc\u00E8s au dossier, ou utilise T\u00E9l\u00E9charger une copie."));
        setStatus(tr("Pr\u00E9paration du projet et de ses fichiers audio\u2026"));
        const blob = await encodeProject(snapshot, getAudioBlob);
        if (!handle && directory) {
            handle = await newProjectFile(directory, projectFilename(snapshot.name));
            setAccessible(true);
        }
        if (handle) {
            await writeProjectFile(handle, blob);
            setFileHandle(handle);
            setFilename(handle.name);
            setBaseline(JSON.stringify(snapshot));
            setStatus(tr("Projet enregistr\u00E9 sur ton disque."));
            if (directory) {
                try {
                    setFiles(await listProjectFiles(directory));
                }
                catch {
                    setAccessible(false);
                }
            }
        }
        else {
            download(blob, projectFilename(snapshot.name));
            setFilename(projectFilename(snapshot.name));
            setBaseline(JSON.stringify(snapshot));
            setStatus(tr("T\u00E9l\u00E9chargement demand\u00E9 : conserve le fichier .minidaw sur ton disque."));
        }
    }
    async function pickDirectory() {
        const handle = await chooseDirectory();
        generation.current++;
        const found = await listProjectFiles(handle);
        setDirectory(handle);
        setAccessible(true);
        setFiles(found);
        setFileHandle(null);
        setFilename('');
        setBaseline('');
        try {
            await rememberDirectory(handle);
            setStatus(tr("Dossier choisi. Clique sur Enregistrer le projet pour y conserver ton morceau."));
        }
        catch {
            setStatus(tr("Dossier disponible pour cette session. Il faudra le choisir de nouveau apr\u00E8s rechargement."));
        }
    }
    return <section className="project-panel" aria-label={tr("Gestion des projets")}>
    <div className="project-toolbar"><label>{tr("Projet")}<input aria-label={tr("Nom du projet")} maxLength={200} value={project.name} disabled={locked} onChange={e => onName(e.target.value)}/></label>
      <button disabled={locked} onClick={() => void run(async () => { if (!mayReplace())
        return; onNew(); setFileHandle(null); setFilename(''); setBaseline(''); setStatus(tr("Nouveau morceau. Enregistre-le pour le conserver sur disque.")); })}>{tr("Nouveau")}</button>
      <button disabled={locked} onClick={() => input.current?.click()}>{tr("Ouvrir un projet")}</button>
      <button className="project-save" disabled={locked || !project.name.trim()} onClick={() => void run(() => save())}>{tr("Enregistrer le projet")}</button>
      <button disabled={locked || !project.name.trim()} onClick={() => void run(() => save(true))}>{tr("Enregistrer une copie")}</button>
      <button disabled={locked || Boolean(project.pendingRetake)} title={project.pendingRetake ? tr("Valide ou refuse la nouvelle prise avant l\u2019export.") : tr("Mix st\u00E9r\u00E9o \u00B7 WAV 16 bits / 44,1 kHz")} onClick={() => void run(async () => {
            setExportMessage('');
            stopPlayback();
            const result = await exportProjectAudio(project, setStatus);
            download(result.blob, result.filename);
            setStatus(tr("Export WAV termin\u00E9."));
            setExportMessage(result.peak >= 1 ? tr("WAV t\u00E9l\u00E9charg\u00E9 \u00B7 Saturation d\u00E9tect\u00E9e : baisse les volumes ou la sortie g\u00E9n\u00E9rale puis exporte \u00E0 nouveau.") : tr("WAV t\u00E9l\u00E9charg\u00E9 \u00B7 St\u00E9r\u00E9o, 16 bits / 44,1 kHz \u00B7 4 secondes de fin pour les r\u00E9sonances et effets."));
        })}>{tr("Exporter en WAV")}</button>
      <input ref={input} type="file" accept=".minidaw" hidden onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file)
        void run(() => open(file, null)); }}/>
    </div>
    <p className="project-state" role="status">{working ? tr(status) : dirty ? tr("Modifications \u00E0 enregistrer sur disque.") : tr(status)}{filename && <span> · {filename}</span>}</p>
    {tr(exportMessage) && <p className="project-state" role="status">{tr(exportMessage)}</p>}
    {tr(error) && <p className="project-error" role="alert">{tr(error)}</p>}
    <details className="project-library"><summary>{tr("Mon dossier de projets")}{directory ? ` · ${directory.name}` : ''}</summary>
      {directorySupported() ? <>
        <div className="project-folder-actions"><button disabled={locked} onClick={() => void run(pickDirectory)}>{directory ? tr("Changer de dossier") : tr("Choisir un dossier")}</button>
          {directory && <><button disabled={locked} onClick={() => void run(async () => { if (await directory.requestPermission({ mode: 'readwrite' }) !== 'granted')
            throw new Error(tr("L\u2019acc\u00E8s au dossier n\u2019a pas \u00E9t\u00E9 autoris\u00E9.")); setAccessible(true); setFiles(await listProjectFiles(directory)); })}>{accessible ? tr("Actualiser") : tr("R\u00E9autoriser le dossier")}</button><button disabled={locked} onClick={() => void run(async () => { await rememberDirectory(null); generation.current++; setDirectory(null); setAccessible(false); setFiles([]); setFileHandle(null); setFilename(''); setBaseline(''); })}>{tr("Oublier ce dossier")}</button></>}
          <button disabled={locked || !project.name.trim()} onClick={() => void run(async () => { const snapshot = project, blob = await encodeProject(snapshot, getAudioBlob); download(blob, projectFilename(snapshot.name)); setStatus(tr("T\u00E9l\u00E9chargement demand\u00E9.")); })}>{tr("T\u00E9l\u00E9charger une copie")}</button>
        </div>
        <p>{tr("Le dossier choisi contient tes fichiers .minidaw. Enregistre apr\u00E8s tes modifications ; l\u2019autosauvegarde reste une copie de travail dans le navigateur.")}</p>
        {directory && !accessible && <p>{tr("R\u00E9autorise le dossier pour retrouver ses projets.")}</p>}
        {directory && accessible && (files.length ? <ul className="project-file-list">{files.map(file => <li key={file.name}><button disabled={locked} onClick={() => void run(async () => { const handle = await directory.getFileHandle(file.name); await open(await handle.getFile(), handle); })}>{file.name}</button><small>{new Date(file.modified).toLocaleDateString(localeTag())} · {(file.size / 1024 / 1024).toFixed(1)}{tr(" Mo")}</small></li>)}</ul> : <p>{tr("Aucun projet .minidaw dans ce dossier pour le moment.")}</p>)}
      </> : <p>{tr("Ce navigateur utilise l\u2019ouverture et le t\u00E9l\u00E9chargement manuels des fichiers .minidaw. Chaque fichier contient aussi tes prises audio.")}</p>}
    </details>
    <small>{tr("Les fichiers de projet servent \u00E0 reprendre le travail. Pour \u00E9couter le mix dans un lecteur audio, utilise Exporter en WAV.")}</small>
  </section>;
}
