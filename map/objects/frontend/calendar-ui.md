---
type: object
cluster: frontend
universe: live
status: verified
entity: frontend/src/pages/Calendar.tsx
---

# Calendar UI

The month/day calendar view. Merges two different sources client-side: Fjord's own `category=meeting` tasks (`api.listTasks`) and read-only external iCloud events (`api.listExternalEvents`) — see the "two calendars, one word" note in the root `CONTEXT.md`.

## Shape

- `pages/Calendar.tsx` — the page, owns the merge of the two event sources
- `components/calendar/`: `CalendarHeader.tsx`, `CalendarBody.tsx`, `MonthGrid.tsx`, `MonthScroller.tsx`, `DayColumn.tsx`, `EventBlocks.tsx` (rendering), `MeetingsPanel.tsx`, `MobileDaySelector.tsx`
- Modals: `NewMeetingModal.tsx`, `NewMeetingInline.tsx`, `SeriesEditModal.tsx` (edits a whole recurrence series, see `processes/recurrence-expand.md`), `ExternalEventDetailModal.tsx` (read-only — external events can't be edited from here), `DateTimePicker.tsx`

## Connected to

- **owns:** nothing — view over `objects/core/task.md` (meetings) and `objects/calendar-sync/caldav-client.md` (external events)
- **owned-by:** nothing
- **joins:** `objects/frontend/api-client.md` for both data sources
- **looks-like-but-is-not:** a single unified "events" model — external events and Fjord meetings are different shapes (`ExternalEvent` vs `Task`) merged only in this component tree; `ExternalEventDetailModal` being separate from the task detail modal is a direct consequence

## If you change this

- **Hits:** nothing server-side; a `Task` schema change (meeting fields) or `ExternalEvent` schema change both hit this cluster
- **Does not hit:** `objects/frontend/board-ui.md` (separate tree); non-meeting tasks never reach here (`category=task` rows are filtered out)

## Surfaces

| Surface | Role |
|---|---|
| `objects/frontend/api-client.md` | reads/writes |

## See

- Source: `frontend/src/pages/Calendar.tsx`, `frontend/src/components/calendar/`
