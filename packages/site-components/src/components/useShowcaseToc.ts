import { useContext } from "react";
import { ShowcaseTocContext } from "./showcaseTocContext.js";

export function useShowcaseToc() {
  return useContext(ShowcaseTocContext);
}
