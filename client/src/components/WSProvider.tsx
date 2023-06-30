import { createContext, useContext, type Component } from "solid-js";
import { WSService } from "@/services/socketService";
const WSContext = createContext<WSService>();

export const WSProvider: Component<{ children: any }> = (props) => {
  const wsConnection = new WSService();
  wsConnection.init();

  return (
    <WSContext.Provider value={wsConnection}>
      {props.children}
    </WSContext.Provider>
  );
};

export function useWS() {
  return useContext(WSContext);
}
