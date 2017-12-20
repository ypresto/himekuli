import { Mongo } from "meteor/mongo"

export interface Avatar {
  userId: string
  gravatarUrl: string
}

// readonly collection
export const Avatars = new Mongo.Collection<Avatar>("avatars", {});
export default Avatars
