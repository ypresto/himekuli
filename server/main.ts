import { Meteor } from 'meteor/meteor'
import Journals from '../imports/api/journals'

Meteor.startup(() => {
  Journals.setup()
})
