import { useSyncExternalStore } from "react";
import isLogged from "./isLogged";

function subscribeToLoginState(onStoreChange) {
  window.addEventListener("focus", onStoreChange);

  return () => {
    window.removeEventListener("focus", onStoreChange);
  };
}

function getServerLoginState() {
  return false;
}

export default function useLoginState() {
  return useSyncExternalStore(
    subscribeToLoginState,
    isLogged,
    getServerLoginState,
  );
}
