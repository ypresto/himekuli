import * as React from "react";
import {
  Card,
  CardAction,
  CardActions,
  CardPrimary,
  CardSupportingText,
  CardTitle,
  Elevation,
  Grid,
  GridCell,
  Icon,
  Toolbar,
  ToolbarRow,
  ToolbarSection,
  ToolbarTitle,
  Typography,
} from "rmwc";
import * as lodash from "lodash"
import * as moment from "moment"
import Linkify from "react-linkify"
import { Meteor } from 'meteor/meteor';
import { withTracker } from "meteor/react-meteor-data";
import Blaze from "meteor/gadicc:blaze-react-component"
import * as _ from "lodash"

import { Journals, Journal } from "../api/journals"
import { Avatars, Avatar } from "../api/avatars"
import {
  CAPTION_TEXT_COLOR,
  FLAT_LIGHT_BUTTON_DISABLED_TEXT_COLOR,
  MAX_SCREEN_WIDTH,
  ORDINAL_TEXT_COLOR,
} from "./material-constants";


type User = Meteor.User

const DATE_FORMAT = "YYYY/MM/DD"
const GREY50 = "#F5F5F5"


const JournalCardPrimary = (props: { user: User, avatarUrl: string, dateLabel: string, isHistory?: boolean, canEdit?: boolean, onEditClick?(): void }) => {
  const user = props.user
  const iconStyle: React.CSSProperties = { position: "absolute", width: 40, height: 40, borderRadius: 50 }
  return (
    <CardPrimary style={{ position: "relative", minHeight: "calc(40px + 16px*2)" }}>
      <img style={iconStyle} src={props.avatarUrl} />
      <div style={{ marginLeft: 56 }}>
        <CardTitle>{user.username || user.profile && user.profile.name || '(noname)'}</CardTitle>
        <Typography use="caption" style={{ color: CAPTION_TEXT_COLOR, position: "relative" }}>
          {props.dateLabel}
          {props.isHistory ? <Icon use="history" style={{ position: "absolute", top: -1, right: -20, fontSize: "1.25em" }} /> : null}
        </Typography>
      </div>
      {props.canEdit ? (
        <Icon
          className="hk-no-user-select"
          use="mode_edit"
          style={{
            color: FLAT_LIGHT_BUTTON_DISABLED_TEXT_COLOR,
            position: "absolute",
            top: 8,
            right: 8,
            fontSize: 16,
            pointerEvents: props.onEditClick ? null : "none"
          }}
          onClick={() => props.onEditClick && props.onEditClick()} />
      ) : null}
    </CardPrimary>
  )
}

const CreateJournalCard = (props: { currentUser: User, currentDate: string, avatarUrl: string, onClickWrite: () => void }) => (
  <Card style={{ background: GREY50 }}>
    <JournalCardPrimary user={props.currentUser} avatarUrl={props.avatarUrl} dateLabel="No journals written yet" />
    <CardSupportingText>
      <div className="hk-editable-as-is">
        <pre style={{ color: CAPTION_TEXT_COLOR }}>Your the first journal will be here..!</pre>
      </div>
    </CardSupportingText>
    <CardActions>
      <CardAction onClick={() => props.onClickWrite()}>Write for Today</CardAction>
    </CardActions>
  </Card>
)

let editOnNextConstruction = false

type JournalCardProps = { journal: Journal, avatarUrl: string, isSelf: boolean, isToday: boolean, onClickWrite(): void }
type JournalCardState = { isInEdit: boolean, bodyInEdit?: string, isInConfirmDelete: boolean }

class JournalCard extends React.Component<JournalCardProps, JournalCardState> {
  textarea: HTMLTextAreaElement | null = null;

  constructor(props: JournalCardProps, context?: any) {
    super(props, context)
    this.state = { isInEdit: editOnNextConstruction, isInConfirmDelete: false }
    editOnNextConstruction = false
  }

  save(callback?: () => void) {
    if (this.state.bodyInEdit !== undefined) {
      Journals.updateBody(this.props.journal._id, this.state.bodyInEdit, callback)
    }
  }

  delete() {
    Journals.remove(this.props.journal._id)
  }

  focus() {
    this.textarea && this.textarea.focus()
  }

  onFocus() {
    this.setState({ isInEdit: true, bodyInEdit: this.props.journal.body })
  }

  onBlur() {
    this.save(() => this.setState({ isInEdit: false, bodyInEdit: undefined }))
  }

  onInput(newBody: string) {
    this.setState({ bodyInEdit: newBody })
    this.throttledSave()
  }

  throttledSave = lodash.throttle(() => this.save(), 1000)

  render() {
    const { journal, avatarUrl, isSelf, isToday } = this.props
    const { isInEdit, bodyInEdit, isInConfirmDelete } = this.state
    const canEdit = isSelf && isToday
    const user = journal.user!
    // Enforce to show last line break.
    const body = (bodyInEdit ? bodyInEdit : journal.body).replace(/\n$/, "\n ")
    // Prevent from re-forcus just after blur.
    const onEditClick = isInEdit ? undefined : () => this.focus()
    return (
      <Card style={{ background: isToday ? null : GREY50 }}>
        <JournalCardPrimary
          user={user}
          avatarUrl={avatarUrl}
          dateLabel={moment(journal.date).format(DATE_FORMAT)}
          isHistory={!isToday}
          canEdit={canEdit}
          onEditClick={onEditClick} />
        <CardSupportingText>
          <div className="hk-editable-as-is">
            {canEdit ? (
              <textarea
                ref={el => this.textarea = el}
                autoFocus={isInEdit}
                style={{ opacity: isInEdit ? undefined : 0 }}
                className="mdc-card__supporting-text"
                value={bodyInEdit}
                onChange={e => this.onInput(e.currentTarget.value)}
                onDrop={() => bodyInEdit ? undefined : false}
                onFocus={() => this.onFocus()}
                onBlur={() => this.onBlur()} />
            ) : null}
            <pre style={{ color: body ? undefined : CAPTION_TEXT_COLOR, visibility: isInEdit ? "hidden" : null }}>
              <Linkify>{body || "(empty)"}</Linkify>
            </pre>
          </div>
        </CardSupportingText>
        {isSelf ? (
          isInConfirmDelete ? (
            <CardActions>
              <CardAction onClick={() => this.delete()} style={{ color: "#C62828" }}>Really delete this</CardAction>
              <CardAction onClick={() => this.setState({ isInConfirmDelete: false })}>Cancel</CardAction>
            </CardActions>
          ) : (
            <CardActions>
              {isToday
                ? <CardAction onClick={() => this.setState({ isInConfirmDelete: true })}>Delete</CardAction>
                : <CardAction onClick={() => this.props.onClickWrite()}>Write for Today</CardAction>}
            </CardActions>
          )
        ) : null}
      </Card>
    )
  }
}

type JournalGridProps = { currentUser?: User, journals: Journal[], avatarByUserId: { [userId: string]: Avatar } }

class JournalGrid extends React.Component<JournalGridProps, { currentDate: string }> {
  intervalId: number;

  constructor(props: JournalGridProps, context?: any) {
    super(props, context)
    this.state = { currentDate: this.getCurrentDate() }
  }

  componentDidMount() {
    this.setState({ currentDate: this.getCurrentDate() })
    this.intervalId = window.setInterval(() => {
      this.setState({ currentDate: this.getCurrentDate() })
    }, 60 * 1000)
  }

  componentWillUnmount() {
    window.clearInterval(this.intervalId)
  }

  hasSelf() {
    if (!this.props.currentUser) return false;
    const currentUserId = this.props.currentUser._id
    return lodash.some(this.props.journals, journal => journal.userId === currentUserId)
  }

  createNew() {
    editOnNextConstruction = true
    Journals.insertForDate(this.props.currentUser!, this.state.currentDate)
  }

  getCurrentDate(): string {
    return moment().format('YYYY-MM-DD')
  }

  idForJournal(journal: Journal) {
    return `${journal._id}_${journal.date}`
  }

  idForToday(user: User) {
    return `${user._id}_${this.state.currentDate}`
  }

  getGravatarUrl(user?: User) {
    const avatar = user && user._id ? this.props.avatarByUserId[user._id] : undefined
    return avatar ? avatar.gravatarUrl : 'TODO'
  }

  render() {
    const { currentUser, journals } = this.props
    const currentDate = this.state.currentDate
    return (
      <Grid style={{ maxWidth: MAX_SCREEN_WIDTH }}>
        {currentUser ? (
          this.hasSelf() ? null : (
            <GridCell key={this.idForToday(currentUser)} span={4}>
              <CreateJournalCard
                currentUser={currentUser}
                avatarUrl={this.getGravatarUrl(currentUser)}
                currentDate={currentDate}
                onClickWrite={() => this.createNew()} />
            </GridCell>
          )
        ) : (
          <GridCell span={4}>
            <div>Please login first.</div>
          </GridCell>
        )}
        {journals.map(journal => (
          <GridCell key={this.idForJournal(journal)} span={4}>
            <JournalCard
              journal={journal}
              avatarUrl={this.getGravatarUrl(journal.user)}
              isSelf={currentUser ? journal.userId === currentUser._id : false}
              isToday={journal.date === currentDate}
              onClickWrite={() => this.createNew()} />
          </GridCell>
        ))}
      </Grid>
    )
  }
}

const AppToolbar = () => (
  <Elevation z={4}>
    <Toolbar>
      <ToolbarRow>
        <ToolbarSection alignStart>
          <ToolbarTitle>Himekuli</ToolbarTitle>
        </ToolbarSection>
      </ToolbarRow>
    </Toolbar>
  </Elevation>
)

export default class App extends React.Component<{}, {}> {
  render() {
    const JournalGridContainer = withTracker<JournalGridProps, {}>(() => {
      Meteor.subscribe("avatars", 40)
      const journals = lodash(Journals.find().fetch())
        .filter(journal => journal.user)
        .groupBy(journal => journal.userId)
        .map((journals) => lodash.maxBy(journals, journal => journal.date)!)
        .value()
      const avatarByUserId = _.keyBy(Avatars.find().fetch(), avatar => avatar.userId)
      return {
        currentUser: Meteor.user() as User | undefined,
        journals,
        avatarByUserId,
      }
    })(JournalGrid)
    return (
      <div className="mdc-typography" style={{ color: ORDINAL_TEXT_COLOR }}>
        <AppToolbar />
        <div style={{ textAlign: "right" }}>
          <Blaze template="loginButtons" />
        </div>
        <JournalGridContainer />
      </div>
    )
  }
}
