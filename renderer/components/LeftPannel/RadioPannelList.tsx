import React from "react"
import { ListProps } from "@mui/material"
import List from "@mui/material/List"



interface IRadioPannelListContext {
    activeName: string,
    setActiveName: (newActive: string) => void,
    activeIndex: number,
    setActiveIndex: (newActive: number) => void
}

export const RadioPannelListContext = React.createContext<IRadioPannelListContext>({ activeName: "default", setActiveName: () => { }, activeIndex: -1, setActiveIndex: () => { } })

interface IRadioPannelList extends ListProps {
    value:{
        activeName: string,
        setActiveName: (newActive: string) => void,
        activeIndex: number,
        setActiveIndex: (newActive: number) => void
    }
}

function RadioPannelList(props: IRadioPannelList) {
    return (
        <RadioPannelListContext.Provider value={{
            activeIndex: props.value.activeIndex,
            setActiveIndex: props.value.setActiveIndex,
            activeName: props.value.activeName,
            setActiveName: props.value.setActiveName
        }} >
            <List {...props} />
        </RadioPannelListContext.Provider>
    )
}

export default RadioPannelList;