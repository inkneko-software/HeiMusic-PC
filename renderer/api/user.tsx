import baseFetch from "./baseFetch"

export function nav(){
    return baseFetch({
        path: "/api/v1/user/nav"
    })
}