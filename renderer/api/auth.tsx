import baseFetch from "./baseFetch"

export function sendLoginEmailCode(email: string) {
    const form = new FormData()
    form.append("email", email);

    return baseFetch({
        method: "POST",
        path: "/api/v1/auth/sendLoginEmailCode",
        body: form
    })
}

export function login(email: string, code: string) {
    const form = new FormData();
    form.append("email", email);
    form.append("code", code);
    if (typeof(window.electronAPI) !== "undefined"){
        form.append("client", "true");
    }
    return baseFetch({
        path: "/api/v1/auth/login",
        method: "POST",
        body: form
    })
}

export function loginByPassowrd(email: string, password: string) {
    const form = new FormData();
    form.append("email", email);
    form.append("password", password);
    return baseFetch({
        path: "/api/v1/auth/login",
        method: "POST",
        body: form
    })
}



export function sendPasswordResetEmailCode(email?: string){
    const form = new FormData()
    if (typeof(email) !=="undefined"){
        form.append("email", email);
    }

    return baseFetch({
        method: "POST",
        path: "/api/v1/auth/sendPasswordResetEmailCode",
        body: form
    })
}

export function resetPassword(newPassword: string, emailCode: string){
    const form = new FormData()
    form.append("password", newPassword);
    form.append("emailCode", emailCode)

    return baseFetch({
        method: "POST",
        path: "/api/v1/auth/resetPassword",
        body: form
    })
}