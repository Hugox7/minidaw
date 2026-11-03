import {useEffect, useRef, useState} from 'react';
import type {Project} from './types';
import {exportProjectAudio} from './exportAudio';
import {stopPlayback} from './audio';
import {getAudioBlob, restoreProjectAssets} from './audioAssets';
import {decodeProject, encodeProject, projectFilename} from './projectFile';
import {chooseDirectory, chooseSaveFile, directorySupported, listProjectFiles, newProjectFile, recallDirectory, rememberDirectory, savePickerSupported, writeProjectFile} from './projectDirectory';
import type {ProjectDirectoryHandle, ProjectFileHandle} from './projectDirectory';
function download(blob: Blob, name: string) {const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);}
export default function ProjectPanel({project, disabled, onName, onLoad, onNew, onWorking}: {project: Project; disabled: boolean; onName: (name: string) => void; onLoad: (project: Project) => void; onNew: () => void; onWorking: (busy: boolean) => void}) {
  const [directory, setDirectory] = useState<ProjectDirectoryHandle | null>(null), [accessible, setAccessible] = useState(false), [files, setFiles] = useState<Awaited<ReturnType<typeof listProjectFiles>>>([]);
  const [fileHandle, setFileHandle] = useState<ProjectFileHandle | null>(null), [filename, setFilename] = useState(''), [baseline, setBaseline] = useState(''), [status, setStatus] = useState('Copie de travail conservée dans ce navigateur.'), [error, setError] = useState(''), [working, setWorking] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const input = useRef<HTMLInputElement>(null), generation = useRef(0);
  const locked = disabled || working, dirty = Boolean(baseline && baseline !== JSON.stringify(project));
  useEffect(() => {
    let cancelled = false; const request = generation.current;
    if (directorySupported()) void recallDirectory().then(async handle => {
      if (!handle || cancelled || generation.current !== request) return;
      const allowed = await handle.queryPermission({mode: 'readwrite'}) === 'granted';
      const found = allowed ? await listProjectFiles(handle) : [];
      if (!cancelled && generation.current === request) {setDirectory(handle); setAccessible(allowed); setFiles(found);}
    }).catch(() => {});
    return () => {cancelled = true;};
  }, []);
  async function run(action: () => Promise<void>) {
    if (locked) return; setWorking(true); onWorking(true); setError('');
    try {await action();} catch (value) {
      if (value instanceof Error && value.name === 'AbortError') setStatus('Opération annulée. Le projet reste ouvert.');
      else {setError(value instanceof Error && value.name === 'NotAllowedError' ? 'Accès au fichier refusé. Réautorise le dossier ou enregistre une copie.' : value instanceof Error ? value.message : String(value)); if (value instanceof Error && value.name === 'NotAllowedError') setAccessible(false);}
    } finally {setWorking(false); onWorking(false);}
  }
  function mayReplace() {if (baseline && !dirty) return true; return confirm('Ouvrir ou créer un autre projet remplacera la copie de travail actuelle dans ce navigateur. Enregistre ton morceau avant de continuer si tu veux le conserver. Continuer ?');}
  async function open(file: File, handle: ProjectFileHandle | null) {
    setStatus('Vérification du projet et de ses prises…');
    const packed = await decodeProject(file);
    if (!mayReplace()) {setStatus('Ouverture annulée. Le projet reste ouvert.'); return;}
    const next = await restoreProjectAssets(packed.project, packed.assets);
    onLoad(next); setFileHandle(handle); setFilename(file.name); setBaseline(JSON.stringify(next)); setStatus('Projet chargé avec ses prises audio.');
  }
  async function save(copy = false) {
    const snapshot = project; let handle = copy ? null : fileHandle;
    // Native pickers must run before asynchronous packing while the click is active.
    if (!handle && !directory && savePickerSupported()) handle = await chooseSaveFile(projectFilename(snapshot.name + (copy ? ' - copie' : '')));
    if (directory && !handle && !accessible && await directory.requestPermission({mode: 'readwrite'}) !== 'granted') throw new Error('Autorise l’accès au dossier, ou utilise Télécharger une copie.');
    setStatus('Préparation du projet et de ses fichiers audio…');
    const blob = await encodeProject(snapshot, getAudioBlob);
    if (!handle && directory) {handle = await newProjectFile(directory, projectFilename(snapshot.name)); setAccessible(true);}
    if (handle) {
      await writeProjectFile(handle, blob); setFileHandle(handle); setFilename(handle.name); setBaseline(JSON.stringify(snapshot)); setStatus('Projet enregistré sur ton disque.');
      if (directory) {try {setFiles(await listProjectFiles(directory));} catch {setAccessible(false);}}
    } else {download(blob, projectFilename(snapshot.name)); setFilename(projectFilename(snapshot.name)); setBaseline(JSON.stringify(snapshot)); setStatus('Téléchargement demandé : conserve le fichier .minidaw sur ton disque.');}
  }
  async function pickDirectory() {
    const handle = await chooseDirectory(); generation.current++;
    const found = await listProjectFiles(handle); setDirectory(handle); setAccessible(true); setFiles(found); setFileHandle(null); setFilename(''); setBaseline('');
    try {await rememberDirectory(handle); setStatus('Dossier choisi. Clique sur Enregistrer le projet pour y conserver ton morceau.');} catch {setStatus('Dossier disponible pour cette session. Il faudra le choisir de nouveau après rechargement.');}
  }
  return <section className="project-panel" aria-label="Gestion des projets">
    <div className="project-toolbar"><label>Projet<input aria-label="Nom du projet" maxLength={200} value={project.name} disabled={locked} onChange={e => onName(e.target.value)}/></label>
      <button disabled={locked} onClick={() => void run(async() => {if (!mayReplace()) return; onNew(); setFileHandle(null); setFilename(''); setBaseline(''); setStatus('Nouveau morceau. Enregistre-le pour le conserver sur disque.');})}>Nouveau</button>
      <button disabled={locked} onClick={() => input.current?.click()}>Ouvrir un projet</button>
      <button className="project-save" disabled={locked || !project.name.trim()} onClick={() => void run(() => save())}>Enregistrer le projet</button>
      <button disabled={locked || !project.name.trim()} onClick={() => void run(() => save(true))}>Enregistrer une copie</button>
      <button disabled={locked || Boolean(project.pendingRetake)} title={project.pendingRetake ? 'Valide ou refuse la nouvelle prise avant l’export.' : 'Mix stéréo · WAV 16 bits / 44,1 kHz'} onClick={() => void run(async() => {
        setExportMessage(''); stopPlayback();
        const result = await exportProjectAudio(project, setStatus);
        download(result.blob, result.filename);
        setStatus('Export WAV terminé.');
        setExportMessage(result.peak >= 1 ? 'WAV téléchargé · Saturation détectée : baisse les volumes ou la sortie générale puis exporte à nouveau.' : 'WAV téléchargé · Stéréo, 16 bits / 44,1 kHz · 4 secondes de fin pour les résonances et effets.');
      })}>Exporter en WAV</button>
      <input ref={input} type="file" accept=".minidaw" hidden onChange={e => {const file = e.target.files?.[0]; e.target.value = ''; if (file) void run(() => open(file, null));}}/>
    </div>
    <p className="project-state" role="status">{working ? status : dirty ? 'Modifications à enregistrer sur disque.' : status}{filename && <span> · {filename}</span>}</p>
    {exportMessage && <p className="project-state" role="status">{exportMessage}</p>}
    {error && <p className="project-error" role="alert">{error}</p>}
    <details className="project-library"><summary>Mon dossier de projets{directory ? ` · ${directory.name}` : ''}</summary>
      {directorySupported() ? <>
        <div className="project-folder-actions"><button disabled={locked} onClick={() => void run(pickDirectory)}>{directory ? 'Changer de dossier' : 'Choisir un dossier'}</button>
          {directory && <><button disabled={locked} onClick={() => void run(async() => {if (await directory.requestPermission({mode: 'readwrite'}) !== 'granted') throw new Error('L’accès au dossier n’a pas été autorisé.'); setAccessible(true); setFiles(await listProjectFiles(directory));})}>{accessible ? 'Actualiser' : 'Réautoriser le dossier'}</button><button disabled={locked} onClick={() => void run(async() => {await rememberDirectory(null); generation.current++; setDirectory(null); setAccessible(false); setFiles([]); setFileHandle(null); setFilename(''); setBaseline('');})}>Oublier ce dossier</button></>}
          <button disabled={locked || !project.name.trim()} onClick={() => void run(async() => {const snapshot = project, blob = await encodeProject(snapshot, getAudioBlob); download(blob, projectFilename(snapshot.name)); setStatus('Téléchargement demandé.');})}>Télécharger une copie</button>
        </div>
        <p>Le dossier choisi contient tes fichiers .minidaw. Enregistre après tes modifications ; l’autosauvegarde reste une copie de travail dans le navigateur.</p>
        {directory && !accessible && <p>Réautorise le dossier pour retrouver ses projets.</p>}
        {directory && accessible && (files.length ? <ul className="project-file-list">{files.map(file => <li key={file.name}><button disabled={locked} onClick={() => void run(async() => {const handle = await directory.getFileHandle(file.name); await open(await handle.getFile(), handle);})}>{file.name}</button><small>{new Date(file.modified).toLocaleDateString('fr-FR')} · {(file.size / 1024 / 1024).toFixed(1)} Mo</small></li>)}</ul> : <p>Aucun projet .minidaw dans ce dossier pour le moment.</p>)}
      </> : <p>Ce navigateur utilise l’ouverture et le téléchargement manuels des fichiers .minidaw. Chaque fichier contient aussi tes prises audio.</p>}
    </details>
    <small>Les fichiers de projet servent à reprendre le travail. Pour écouter le mix dans un lecteur audio, utilise Exporter en WAV.</small>
  </section>;
}
