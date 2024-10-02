import Axios, { AxiosInstance } from "axios";
import { AllHttpMethodsLowercase, BasicCredentialsStringToAuthenticationHeader, ExpectAuthenticationHeader, ExpectBasicCredentialsString, ExpectUrlEndingInSlash } from "@layer92/core";
import { Expect } from "@layer92/core";
export type OnAxiosHttpError = (data:{statusCode:number,statusText:string,responseBody:any})=>void|Promise<void>;

type RequestArgumentsBeyondMethod = {
    pathOnHost:string,
    body?:any,
    addHeaders?:{
        [key:string]:string,
    },
    addFormDataEntries?:[string,any][],
    onHttpError?:OnAxiosHttpError,
};

export class AxiosWebClient{

    readonly _axios:AxiosInstance;
    constructor(private _needs:{
        baseUrl?: string;
        customMethodImplementation?:"AppendWithColonThenPost",
        initialAuthenticationHeader?:string,
        onSetAuthenticationHeaderAsync?:(maybeHeader:string|undefined)=>void|Promise<void>,
    }){
        if(this._needs.baseUrl){
            ExpectUrlEndingInSlash(this._needs.baseUrl);
        }
        this._axios = Axios.create({
            baseURL:this._needs.baseUrl
        });
        if(this._needs.initialAuthenticationHeader){
            ExpectAuthenticationHeader(this._needs.initialAuthenticationHeader);
            this.setAuthenticationHeader(this._needs.initialAuthenticationHeader)
        }
    }

    /**
     * @returns the body data of the request
     * 
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async requestAsync({
        method,
        pathOnHost,
        body,
        addHeaders,
        addFormDataEntries,
        onHttpError,
    }:{
        method:string
    }&RequestArgumentsBeyondMethod){
        if(pathOnHost.endsWith("/")){
            pathOnHost = pathOnHost.slice(0,-1);
        }
        const isCustomMethod = !AllHttpMethodsLowercase.includes(method);
        if( isCustomMethod ){
            if( this._needs.customMethodImplementation==="AppendWithColonThenPost" ){
                pathOnHost += ":"+method;
                method = "post";
            }else{
                if(!this._needs.customMethodImplementation){
                    throw new Error("Encountered a custom http method, but no implementation for that method was specified.");
                }
                throw new Error ("Not yet implemented: "+this._needs.customMethodImplementation);
            }
        }
        let headers = {
            ...(this._axios.defaults?.headers||{} as any),
            ...(addHeaders||{})
        };
        const isFileRequest = body instanceof Blob;
        if( isFileRequest && method==="post" ){
            const formData = new FormData();
            formData.append(`file`,body);
            body = formData;
            headers[`Content-Type`] = `multipart/form-data`;
        }
        if( body instanceof FormData ){
            for(const [key,value] of addFormDataEntries){
                body.append(key,value);
            }
            headers = {
                ...headers,
                ...((body as any).getHeaders?.()||{}),
            }
            // move file to end of form body, because some services require it to be at the end (such as AWS)
            // "The file or content must be the last field in the form." (https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTForms.html)
            const file:FormDataEntryValue = body.get(`file`);
            body.delete(`file`);
            body.append(`file`,file);
        }
        try{
            const axiosResult = await this._axios({
                method,
                url: pathOnHost,
                data: body,
                headers,
            });
            return axiosResult.data;
        }catch(axiosError:any){
            if( axiosError.response && axiosError.response.status){
                const {status:statusCode,statusText,data:responseBody} = axiosError.response;
                const path = (this._needs.baseUrl||"")+pathOnHost;
                onHttpError?.({statusCode,statusText,responseBody});
                throw new Error("AxiosWebClient: AxiosError:\n"+JSON.stringify({path,method,statusCode,statusText,responseBody},null,4));
            }
            throw axiosError;
        }
    }
    /**
     * @returns the body data of the request
     * 
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async getAsync(arguments_:RequestArgumentsBeyondMethod){
        return this.requestAsync({
            method:"get",
            ...arguments_
        })
    }
    /**
     * @returns the body data of the request
     * 
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async postAsync(arguments_:RequestArgumentsBeyondMethod){
        return this.requestAsync({
            method:"post",
            ...arguments_
        })
    }
    /**
     * @returns the body data of the request
     * 
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async patchAsync(arguments_:RequestArgumentsBeyondMethod){
        return this.requestAsync({
            method:"patch",
            ...arguments_
        })
    }
    /**
     * @returns the body data of the request
     * 
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async putAsync(arguments_:RequestArgumentsBeyondMethod){
        return this.requestAsync({
            method:"put",
            ...arguments_
        })
    }
    /**
     * @returns the body data of the request
     * 
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async deleteAsync(arguments_:RequestArgumentsBeyondMethod){
        return this.requestAsync({
            method:"delete",
            ...arguments_
        })
    }
    /**
     * @returns the body data of the request
     * 
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async headAsync(arguments_:RequestArgumentsBeyondMethod){
        return this.requestAsync({
            method:"head",
            ...arguments_
        })
    }
    /**
     * @returns the body data of the request
     * 
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async optionsAsync(arguments_:RequestArgumentsBeyondMethod){
        return this.requestAsync({
            method:"options",
            ...arguments_
        })
    }
    
    setBearerToken(token:string){
        const header = ("Bearer "+token);
        this.setAuthenticationHeader(header);
    }

    maybeGetBearerToken(){
        if(!this._axios.defaults.headers.Authorization){
            return undefined;
        }
        const authorizationHeader = ""+this._axios.defaults.headers.Authorization;
        if(!authorizationHeader){
            return undefined;
        }
        Expect(authorizationHeader.startsWith("Bearer "),`Expected authorization header to start with "Bearer ". authorizationHeader: ${authorizationHeader}`);
        const token = authorizationHeader.split("Bearer ")[1];
        return token;
    }

    /**
     * @param basicCredentials a string in the form username:password
     */
    setBasicCredentialsString(basicCredentials:string){
        ExpectBasicCredentialsString(basicCredentials);
        const header = BasicCredentialsStringToAuthenticationHeader(basicCredentials);
        this.setAuthenticationHeader(header);
    }

    /**
     * @param header A string in the form "Type value", eg "Basic username:password" or "Bearer foo". Despite going into the "Authorization" header of an HTTP request, this header is actually used for authentication, so that's what we're calling it.
     */
    setAuthenticationHeader(header:string){
        ExpectAuthenticationHeader(header);
        this._axios.defaults.headers.Authorization = header;
        this._needs.onSetAuthenticationHeaderAsync?.(header);
    }

    clearAuthenticationCredentials(){
        delete this._axios.defaults.headers.Authorization;
        this._needs.onSetAuthenticationHeaderAsync?.(undefined);
    }

    hasAuthenticationCredentials(){
        return !!this._axios.defaults.headers.Authorization;
    }
}

