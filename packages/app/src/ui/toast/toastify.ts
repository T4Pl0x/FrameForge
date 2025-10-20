import { useToast } from "./ToastProvider";

export function useToastify(){
  const { push } = useToast();
  return {
    ok:(t:string)=>push({kind:"success",text:t}),
    info:(t:string)=>push({kind:"info",text:t}),
    warn:(t:string)=>push({kind:"warn",text:t}),
    fail:(t:string)=>push({kind:"error",text:t}),
  } as const;
}

