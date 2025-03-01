"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosWebClient = void 0;
const axios_1 = require("axios");
const core_1 = require("@layer92/core");
const core_2 = require("@layer92/core");
class AxiosWebClient {
    constructor(_needs) {
        this._needs = _needs;
        if (this._needs.baseUrl) {
            (0, core_1.ExpectUrlEndingInSlash)(this._needs.baseUrl);
        }
        this._axios = axios_1.default.create({
            baseURL: this._needs.baseUrl
        });
        if (this._needs.initialAuthenticationHeader) {
            (0, core_1.ExpectAuthenticationHeader)(this._needs.initialAuthenticationHeader);
            this.setAuthenticationHeader(this._needs.initialAuthenticationHeader);
        }
    }
    /**
     * @returns the body data of the request
     *
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async requestAsync({ method, pathOnHost, body, addHeaders, addFormDataEntries, onHttpError, verbose, }) {
        if (pathOnHost.endsWith("/")) {
            pathOnHost = pathOnHost.slice(0, -1);
        }
        const isCustomMethod = !core_1.AllHttpMethodsLowercase.includes(method);
        if (isCustomMethod) {
            if (this._needs.customMethodImplementation === "AppendWithColonThenPost") {
                pathOnHost += ":" + method;
                method = "post";
            }
            else {
                if (!this._needs.customMethodImplementation) {
                    throw new Error("Encountered a custom http method, but no implementation for that method was specified.");
                }
                throw new Error("Not yet implemented: " + this._needs.customMethodImplementation);
            }
        }
        let headers = {
            ...this._axios.defaults.headers,
            // ...(this._axios.defaults?.headers||{} as any),
            ...(addHeaders || {})
        };
        const isFileRequest = body instanceof Blob;
        if (isFileRequest && (method === "post" || method == "put")) {
            const formData = new FormData();
            formData.append(`file`, body);
            body = formData;
            headers[`Content-Type`] = `multipart/form-data`;
        }
        if (body instanceof FormData) {
            for (const [key, value] of addFormDataEntries || []) {
                body.append(key, value);
            }
            headers = {
                ...headers,
                ...(body.getHeaders?.() || {}),
            };
            // move file to end of form body, because some services require it to be at the end (such as AWS)
            // "The file or content must be the last field in the form." (https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTForms.html)
            const file = body.get(`file`);
            body.delete(`file`);
            body.append(`file`, file);
        }
        try {
            if (verbose === "request") {
                console.log("AxiosWebClient.requestAsync:", {
                    method,
                    url: pathOnHost,
                    headers,
                    data: body,
                });
            }
            const axiosResult = await this._axios({
                method,
                url: pathOnHost,
                headers,
                data: body,
            });
            return axiosResult.data;
        }
        catch (axiosError) {
            if (axiosError.response && axiosError.response.status) {
                const { status: statusCode, statusText, data: responseBody } = axiosError.response;
                const path = (this._needs.baseUrl || "") + pathOnHost;
                onHttpError?.({ statusCode, statusText, responseBody });
                throw new Error("AxiosWebClient: AxiosError:\n" + JSON.stringify({ path, method, statusCode, statusText, responseBody }, null, 4));
            }
            throw axiosError;
        }
    }
    /**
     * @returns the body data of the request
     *
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async getAsync(arguments_) {
        return this.requestAsync({
            method: "get",
            ...arguments_
        });
    }
    /**
     * @returns the body data of the request
     *
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async postAsync(arguments_) {
        return this.requestAsync({
            method: "post",
            ...arguments_
        });
    }
    /**
     * @returns the body data of the request
     *
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async patchAsync(arguments_) {
        return this.requestAsync({
            method: "patch",
            ...arguments_
        });
    }
    /**
     * @returns the body data of the request
     *
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async putAsync(arguments_) {
        return this.requestAsync({
            method: "put",
            ...arguments_
        });
    }
    /**
     * @returns the body data of the request
     *
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async deleteAsync(arguments_) {
        return this.requestAsync({
            method: "delete",
            ...arguments_
        });
    }
    /**
     * @returns the body data of the request
     *
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async headAsync(arguments_) {
        return this.requestAsync({
            method: "head",
            ...arguments_
        });
    }
    /**
     * @returns the body data of the request
     *
     * @param 0.body: you can provide a File (or Blob) as the body if you'd like to submit a file. If you're POSTing a file, the request body will become multi-part FormData
     * */
    async optionsAsync(arguments_) {
        return this.requestAsync({
            method: "options",
            ...arguments_
        });
    }
    setBearerToken(token) {
        const header = ("Bearer " + token);
        this.setAuthenticationHeader(header);
    }
    maybeGetBearerToken() {
        if (!this._axios.defaults.headers.Authorization) {
            return undefined;
        }
        const authorizationHeader = "" + this._axios.defaults.headers.Authorization;
        if (!authorizationHeader) {
            return undefined;
        }
        (0, core_2.Expect)(authorizationHeader.startsWith("Bearer "), `Expected authorization header to start with "Bearer ". authorizationHeader: ${authorizationHeader}`);
        const token = authorizationHeader.split("Bearer ")[1];
        return token;
    }
    /**
     * @param basicCredentials a string in the form username:password
     */
    setBasicCredentialsString(basicCredentials) {
        (0, core_1.ExpectBasicAccessCredentials)(basicCredentials);
        const header = (0, core_1.BasicCredentialsStringToAuthenticationHeader)(basicCredentials);
        this.setAuthenticationHeader(header);
    }
    /**
     * @param header A string in the form "Type value", eg "Basic username:password" or "Bearer foo". Despite going into the "Authorization" header of an HTTP request, this header is actually used for authentication, so that's what we're calling it.
     */
    setAuthenticationHeader(header) {
        (0, core_1.ExpectAuthenticationHeader)(header);
        this._axios.defaults.headers.Authorization = header;
        this._needs.onSetAuthenticationHeaderAsync?.(header);
    }
    clearHeader(key) {
        this.setHeader(key, undefined);
    }
    // from axios: type AxiosHeaderValue = string | string[] | number | boolean | null;, but we're going to use just strings by choice
    setHeader(key, value) {
        this._axios.defaults.headers[key] = value;
    }
    maybeGetHeader(key) {
        const value = this._axios.defaults.headers[key];
        if (value === undefined) {
            return undefined;
        }
        return value.toString();
    }
    clearAuthenticationCredentials() {
        delete this._axios.defaults.headers.Authorization;
        this._needs.onSetAuthenticationHeaderAsync?.(undefined);
    }
    hasAuthenticationCredentials() {
        return !!this._axios.defaults.headers.Authorization;
    }
}
exports.AxiosWebClient = AxiosWebClient;
