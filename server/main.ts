import { Meteor, Subscription } from "meteor/meteor"
import { Mongo } from "meteor/mongo"
import Journals from "../imports/api/journals"
import * as gravatar from "gravatar"

type User = Meteor.User;

Meteor.startup(() => {
  Journals.setup()

  Meteor.publish("avatars", function(this: Subscription, size: any) {
    if (typeof size === "number") size = size.toString();
    if (typeof size !== "string") throw new Error("Invalid size arg: " + size)

    const gravatarUrl = (user: User) => gravatar.url(user.services.google.email, { size, default: 'mm' })
    publishTransformedCursor<User>(this, "avatars", Meteor.users.find(), user => (
      { userId: user._id, gravatarUrl: gravatarUrl(user) }
    ))
  })
})

// lend from _publishCursor
function publishTransformedCursor<T extends { _id?: string }>(sub: Subscription, collection: string, cursor: Mongo.Cursor<T>, transform: ((item: T) => any)) {
  const observeHandle = cursor.observe({
    added: (doc: T) => { sub.added(collection, doc._id!, transform(doc)) },
    changed: (doc: T) => { sub.changed(collection, doc._id!, transform(doc)) },
    removed: (doc: T) => { sub.removed(collection, doc._id!) },
  });
  sub.onStop(() => { observeHandle.stop() })
  return observeHandle;
}
