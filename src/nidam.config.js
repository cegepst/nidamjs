export const defaultNotify = (level, message) => {
    const logger = level === "error" ? console.error : console.log;
    logger(`[nidamjs:${level}]`, message);
};

export default {
    root: typeof document !== "undefined" ? document : null,
    modalContainer: "#target",
    pendingModalDatasetKey: "pendingModal",
    registry: [],
    refreshMap: null,
    refreshTimeout: 200,
    notify: defaultNotify,
    windowManager: {},
    ui: {
        theme: "light",
        taskbar_size: "medium",
    }
};
