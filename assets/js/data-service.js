import { db } from './firebase-config.js';
import {
  collection, getDocs, doc, getDoc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

export async function fetchAllData() {
  const metaSnap = await getDoc(doc(db, 'config', 'meta'));
  const modulesSnap = await getDocs(collection(db, 'modules'));
  const meta = metaSnap.exists() ? metaSnap.data() : {};
  const modules = modulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  return { meta, modules };
}

export async function saveMeta(meta) {
  await setDoc(doc(db, 'config', 'meta'), meta, { merge: true });
}

export async function saveModule(mod) {
  const { id, ...fields } = mod;
  await setDoc(doc(db, 'modules', id), fields);
}

export async function deleteModule(id) {
  await deleteDoc(doc(db, 'modules', id));
}
