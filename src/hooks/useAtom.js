import { Atom, deref } from "@dbeining/react-atom";

if (!ENV_PROD) {
  window.atoms = [];
  const newAtom = Atom.of;
  Atom.of = state => {
    const atom = newAtom(state);
    window.atoms.push(() => deref(atom));
    return atom;
  };
}

export {
  Atom,
  addChangeHandler,
  removeChangeHandler,
  deref,
  swap,
  set,
  useAtom
} from "@dbeining/react-atom";
