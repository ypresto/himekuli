import { Card } from "rmwc"
import * as React from "react"

declare module "rmwc" {
  interface CardActionProps extends Card.CardActionProps {
    disabled?: boolean
  }

  export class CardAction extends React.Component<CardActionProps> {}
}
