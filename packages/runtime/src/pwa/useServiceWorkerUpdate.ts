import { useEffect, useMemo, useState } from "react";
import {
  createServiceWorkerUpdateController,
  type CreateServiceWorkerUpdateControllerOptions,
} from "./register.js";

export function useServiceWorkerUpdate(options: CreateServiceWorkerUpdateControllerOptions = {}) {
  const controller = useMemo(
    () => createServiceWorkerUpdateController(options),
    // options.disabled / scriptUrl are the meaningful inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.disabled, options.scriptUrl],
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const unsubscribe = controller.subscribe(setUpdateAvailable);
    void controller.register();
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [controller]);

  return {
    updateAvailable,
    applyUpdate: controller.applyUpdate,
    deferUpdate: controller.deferUpdate,
    checkForUpdate: controller.checkForUpdate,
  };
}
