import React from "react"
import { ListProps } from "@mui/material"
import List from "@mui/material/List"


interface IPanelListContext {
    name: string,
}

export const PannelListContext = React.createContext<IPanelListContext>({ name: "default" })

interface IPannelList extends ListProps {
    context: IPanelListContext
}


function PannelList(props: IPannelList) {
    return (
        <PannelListContext.Provider value={props.context}>
            <List {...props} />
        </PannelListContext.Provider>
    )
}

export default PannelList;