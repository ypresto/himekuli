import { Meteor } from "meteor/meteor"
import { Mongo } from "meteor/mongo"

type User = Meteor.User

export interface Journal {
  _id: string
  user?: User
  userId: string
  date: string // ISO8601
  body: string
  createdAt: Date
  updatedAt: Date
  // reactions: Reaction[]
  // comments: Comment[]
}

class JournalCollection extends Mongo.Collection<Journal> {
  setup() {
    this._ensureIndex({ "date": 1, "userId": 1 }, { unique: true });
  }

  insertForDate(user: User, date: string, body: string = "") {
    const now = new Date()
    const doc: Partial<Journal> = { userId: user._id, body, date, createdAt: now, updatedAt: now }
    this.insert(doc as Journal)
  }

  updateBody(id: string, body: string, callback?: () => void) {
    const updatedAt = new Date()
    this.update(id, { $set: { body, updatedAt } }, {}, callback)
  }
}

export const Journals = new JournalCollection("journals", {
  transform: (journal: Journal): Journal => {
    journal.user = Meteor.users.findOne(journal.userId) as User | undefined
    return journal as Journal
  }
});

export default Journals
