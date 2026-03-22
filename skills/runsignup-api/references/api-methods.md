# RunSignup API Methods Reference

All endpoints are relative to `https://runsignup.com`. Individual method detail pages are at the full endpoint path (e.g., `https://runsignup.com/API/race/:race_id/participants/GET`).

## Table of Contents

- [Basic Info](#basic-info)
- [Basic Race Information](#basic-race-information)
- [Race Participants](#race-participants)
- [Race Registration Setup](#race-registration-setup)
- [Race Groups/Teams](#race-groupsteams)
- [Results](#results)
- [Results - Activities (Virtual Events)](#results---activities-virtual-events)
- [Results - Custom Fields](#results---custom-fields)
- [Results - Division Placement](#results---division-placement)
- [Results - Notifications](#results---notifications)
- [Results - Splits](#results---splits)
- [Results Announcer](#results-announcer)
- [Team Results](#team-results)
- [Result Settings](#result-settings)
- [Mobile App Results](#mobile-app-results)
- [Race Corrals](#race-corrals)
- [Race Divisions](#race-divisions)
- [Race Series Scoring](#race-series-scoring)
- [Race Fundraisers](#race-fundraisers)
- [Charity Group](#charity-group)
- [Donations](#donations)
- [Coupons](#coupons)
- [Corporate Teams](#corporate-teams)
- [Ticket Events](#ticket-events)
- [Volunteers](#volunteers)
- [Race Photos](#race-photos)
- [Race Store](#race-store)
- [Custom Results Page](#custom-results-page)
- [User Information](#user-information)
- [User Registrations](#user-registrations)
- [Club Memberships](#club-memberships)
- [Basic Club Information](#basic-club-information)
- [Donation Websites](#donation-websites)
- [Super Partners](#super-partners)

---

## Basic Info

| Method | Endpoint |
|---|---|
| Get Countries | `GET /API/countries` |
| Get Auth/Entity Info | `GET /API/v2/auth-info/entity-info.json` |

---

## Basic Race Information

| Method | Endpoint |
|---|---|
| Get Race | `GET /API/race/:race_id` |
| Get Races | `GET /API/races` |
| Create Race | `POST /API/race` |
| Sync Settings | `POST /API/race/:race_id/sync-settings` |
| Race URLs | `POST /API/race/:race_id/race-urls` |
| Race Description | `POST /API/race/:race_id/race-description` |
| Get Non-Binary Support | `GET /API/v2/race-gender-settings/nonbinary-support.json` |
| Set Non-Binary Support | `POST /API/v2/race-gender-settings/nonbinary-support.json` |
| Get Race Theme | `GET /API/v2/race-theme/race-theme.json` |

---

## Race Participants

| Method | Endpoint |
|---|---|
| Get Participant Counts | `GET /API/race/:race_id/participant-counts` |
| Get Modified Counts | `POST /API/v2/participants/modified-counts.json` |
| Get Participants | `GET /API/race/:race_id/participants` |
| Get Removed Participants | `GET /API/race/:race_id/removed-participants` |
| Get Event Transfer Final Registration | `POST /API/race/:race_id/get-event-transfer-participant-final-registration` |
| Add/Edit Participants | `POST /API/race/:race_id/participants` |
| Switch Participant Events | `POST /API/race/:race_id/switch-participant-events` |
| Delete Participants | `POST /API/race/:race_id/delete-participants` |
| Get Bib/Chip | `GET /API/race/:race_id/get-bib-chip` |
| Get Bib Validation Settings | `GET /API/race/:race_id/get-bib-validation-settings` |
| Assign Bib/Chip | `POST /API/race/:race_id/assign-bib-chip` |
| Sign Waivers | `POST /API/v2/participants/sign-waivers.json` |

---

## Race Registration Setup

| Method | Endpoint |
|---|---|
| Create/Edit Registration Periods | `POST /API/race/:race_id/registration-periods` |
| Configure Age-Based Pricing | `POST /API/race/:race_id/pricing/age-based` |
| Set Up Race Questions | `POST /API/race/:race_id/questions` |
| Configure Giveaways | `POST /API/race/:race_id/giveaways` |

---

## Race Groups/Teams

| Method | Endpoint |
|---|---|
| Get Team Types | `GET /API/race/:race_id/teams/team-types` |
| Create/Edit Team Types | `POST /API/race/:race_id/teams/team-types` |
| Get Teams | `GET /API/race/:race_id/teams` |
| Create/Edit Teams | `POST /API/race/:race_id/teams` |
| Assign Team Bibs | `POST /API/race/:race_id/assign-team-bibs` |
| Manage Teams (v2) | `POST /API/v2/teams/manage-teams.json` |
| Get Removed Teams | `GET /API/v2/teams/get-removed-teams.json` |

---

## Results

| Method | Endpoint |
|---|---|
| CSV Import | `POST /API/race/:race_id/results/csv-import` |
| New Result Set | `POST /API/race/:race_id/results/new-result-set` |
| Edit Result Set | `POST /API/race/:race_id/results/edit-result-set` |
| Hide Result Set | `POST /API/race/:race_id/results/hide-result-set` |
| Show Result Set | `POST /API/race/:race_id/results/show-result-set` |
| Has Result Sets | `GET /API/race/:race_id/results/has-result-sets` |
| Get Result Sets | `GET /API/race/:race_id/results/get-result-sets` |
| Delete Result Set | `POST /API/race/:race_id/results/delete-result-set` |
| Get Result Set Columns | `GET /API/race/:race_id/results/customize-result-set-columns` |
| Set Result Set Columns | `POST /API/race/:race_id/results/customize-result-set-columns` |
| Clear Results | `POST /API/race/:race_id/results/clear-results` |
| Clear Results by Reg ID | `POST /API/race/:race_id/results/clear-results-by-reg-id` |
| Clear Results by Missing Reg ID | `POST /API/race/:race_id/results/clear-results-by-missing-reg-id` |
| Get Results | `GET /API/race/:race_id/results/get-results` |
| Post Full Results | `POST /API/race/:race_id/results/full-results` |
| Post User Results | `POST /API/race/:race_id/results/user-results` |
| Manual Division Placements | `POST /API/race/:race_id/results/manual-divisions-placements` |
| Get Deleted Results | `GET /API/race/:race_id/results/get-deleted-results` |
| Get Updated Result Sets | `GET /API/v2/results/updated-result-sets.json` |

---

## Results - Activities (Virtual Events)

| Method | Endpoint |
|---|---|
| Get VR Activity Types | `GET /API/v2/vr-activities/vr-activity-types.json` |
| Get VR Activities | `GET /API/v2/vr-activities.json` |
| Post VR Activities | `POST /API/v2/vr-activities.json` |
| Delete VR Activities | `DELETE /API/v2/vr-activities.json` |

---

## Results - Custom Fields

| Method | Endpoint |
|---|---|
| Get Custom Fields | `GET /API/race/:race_id/results/custom-fields` |
| Create/Edit Custom Fields | `POST /API/race/:race_id/results/custom-fields` |
| Delete Custom Fields | `DELETE /API/race/:race_id/results/custom-fields` |

---

## Results - Division Placement

| Method | Endpoint |
|---|---|
| Disable Division Placement Calc | `POST /API/race/:race_id/results/disable-division-placement-calc` |
| Enable Division Placement Calc | `POST /API/race/:race_id/results/enable-division-placement-calc` |
| Clear Division Placements | `POST /API/race/:race_id/results/clear-division-placements` |
| Recalculate Division Placements | `POST /API/race/:race_id/results/recalc-division-placements` |

---

## Results - Notifications

| Method | Endpoint |
|---|---|
| Get Notifications Toggle Setting | `GET /API/race/:race_id/results/notifications-toggle-setting` |
| Set Notifications Toggle Setting | `POST /API/race/:race_id/results/notifications-toggle-setting` |
| Get Notifications Toggle Splits Setting | `GET /API/race/:race_id/results/notifications-toggle-splits-setting` |
| Set Notifications Toggle Splits Setting | `POST /API/race/:race_id/results/notifications-toggle-splits-setting` |
| Get Notification Stats | `GET /API/race/:race_id/results/notification-stats` |

---

## Results - Splits

| Method | Endpoint |
|---|---|
| Get Result Set Splits | `GET /API/race/:race_id/results/result-set-splits` |
| Create/Edit Result Set Splits | `POST /API/race/:race_id/results/result-set-splits` |

---

## Results Announcer

| Method | Endpoint |
|---|---|
| Get Timing Points | `GET /API/race/:race_id/announcer/timing-points` |
| Create/Edit Timing Points | `POST /API/race/:race_id/announcer/timing-points` |
| Get Timing Point Data | `GET /API/race/:race_id/announcer/timing-points/data` |
| Post Timing Point Data | `POST /API/race/:race_id/announcer/timing-points/data` |
| Delete Timing Point Data | `DELETE /API/race/:race_id/announcer/timing-points/data` |

---

## Team Results

| Method | Endpoint |
|---|---|
| Get Team Result Set | `GET /API/v2/team-results/team-result-set.json` |
| Create/Edit Team Result Set | `POST /API/v2/team-results/team-result-set.json` |
| Delete Team Result Set | `DELETE /API/v2/team-results/team-result-set.json` |
| Get Team Result Set Customizations | `GET /API/v2/team-results/team-result-set-customizations.json` |
| Set Team Result Set Customizations | `POST /API/v2/team-results/team-result-set-customizations.json` |
| Get Team Result Set Member Columns | `GET /API/v2/team-results/team-result-set-member-columns.json` |
| Set Team Result Set Member Columns | `POST /API/v2/team-results/team-result-set-member-columns.json` |
| Get Team Result Set Extra Fields | `GET /API/v2/team-results/team-result-set-extra-fields.json` |
| Set Team Result Set Extra Fields | `POST /API/v2/team-results/team-result-set-extra-fields.json` |
| Get Result Teams | `GET /API/v2/team-results/result-teams.json` |
| Post Result Teams | `POST /API/v2/team-results/result-teams.json` |
| Get Team Result Set Results | `GET /API/v2/team-results/team-result-set-results.json` |
| Post Team Result Set Results | `POST /API/v2/team-results/team-result-set-results.json` |

---

## Result Settings

| Method | Endpoint |
|---|---|
| Get Result Settings | `GET /API/race/:race_id/results/settings` |
| Create/Edit Result Settings | `POST /API/race/:race_id/results/settings` |
| Get VR Settings | `GET /API/v2/vr-settings.json` |

---

## Mobile App Results

| Method | Endpoint |
|---|---|
| Post Start Time | `POST /API/race/:race_id/results/start-time` |
| Get Start Time | `GET /API/race/:race_id/results/start-time` |
| Post Finishing Times | `POST /API/race/:race_id/results/finishing-times` |
| Post Bib Order | `POST /API/race/:race_id/results/bib-order` |
| Get Timing Data | `GET /API/race/:race_id/results/get-timing-data` |
| Get Chute Data | `GET /API/race/:race_id/results/get-chute-data` |
| Delete Timing Data | `POST /API/race/:race_id/results/delete-timing-data` |
| Delete Chute Data | `POST /API/race/:race_id/results/delete-chute-data` |
| Delete Checker Data | `POST /API/race/:race_id/results/delete-checker-data` |

---

## Race Corrals

| Method | Endpoint |
|---|---|
| Get Corrals | `GET /API/race/:race_id/corrals` |
| Manage Corrals | `POST /API/v2/corrals/manage-corrals.json` |
| Delete Corrals | `POST /API/v2/corrals/delete-corrals.json` |

---

## Race Divisions

| Method | Endpoint |
|---|---|
| Get Divisions | `GET /API/race/:race_id/divisions/divisions` |
| Create/Edit Divisions | `POST /API/race/:race_id/divisions/divisions` |
| Get Division Grouping | `GET /API/race/:race_id/divisions/division-grouping` |
| Create/Edit Division Grouping | `POST /API/race/:race_id/divisions/division-grouping` |
| Assign Divisions | `POST /API/race/:race_id/divisions/assign-divisions` |
| Manage Divisions (v2) | `POST /API/v2/divisions/manage-divisions.json` |
| Delete Divisions (v2) | `POST /API/v2/divisions/delete-divisions.json` |

---

## Race Series Scoring

| Method | Endpoint |
|---|---|
| Get Race Series Info | `GET /API/v2/race-series/race-series-info.json` |
| Get Non-Standard Scoring Types | `GET /API/v2/race-series/non-standard-scoring-types.json` |
| Create/Edit Non-Standard Scoring Types | `POST /API/v2/race-series/non-standard-scoring-types.json` |
| Delete Non-Standard Scoring Types | `POST /API/v2/race-series/delete-non-standard-scoring-types.json` |
| Get Race Series Years | `GET /API/v2/race-series/race-series-years.json` |
| Lookup Series Participants | `POST /API/v2/race-series/race-series-participants/lookup.json` |
| Add Series Participant (by reg ID) | `POST /API/v2/race-series/race-series-participants/add/registration-id.json` |
| Add Series Participant (by user ID) | `POST /API/v2/race-series/race-series-participants/add/user-id.json` |
| Add Series Participant (by user info) | `POST /API/v2/race-series/race-series-participants/add/user-info.json` |
| Edit Series Participant | `POST /API/v2/race-series/race-series-participants/edit.json` |
| Link Series Users | `POST /API/v2/race-series/race-series-participants/link-users.json` |
| Post Series Results | `POST /API/v2/race-series/race-series-results.json` |

---

## Race Fundraisers

| Method | Endpoint |
|---|---|
| Get Race Fundraisers | `GET /API/v2/race-fundraisers/get-race-fundraisers.json` |
| Get Fundraiser Donation Amount | `GET /API/v2/race-fundraisers/get-race-fundraisers-donation-amount.json` |
| Update Fundraiser External IDs | `POST /API/v2/race-fundraisers/update-fundraiser-external-ids.json` |

---

## Charity Group

| Method | Endpoint |
|---|---|
| Get Charity Group Race Fundraisers | `GET /API/v2/charity-group/get-charity-group-race-fundraisers.json` |
| Get Charity Group Race Donations | `GET /API/v2/charity-group/get-charity-group-race-donations.json` |

---

## Donations

| Method | Endpoint |
|---|---|
| List Donations | `GET /API/race/:race_id/donations/list` |

---

## Coupons

| Method | Endpoint |
|---|---|
| Create/Edit Coupons | `POST /API/race/:race_id/coupons` |
| Get Coupons | `GET /API/race/:race_id/coupons` |

---

## Corporate Teams

| Method | Endpoint |
|---|---|
| Get Corporate Teams | `GET /API/race/:race_id/corporate-teams` |

---

## Ticket Events

| Method | Endpoint |
|---|---|
| Get Ticket Event | `GET /API/v2/tickets/get-ticket-event.json` |
| Get Ticket Events | `GET /API/v2/tickets/get-ticket-events.json` |
| Get Tickets | `GET /API/v2/tickets/get-tickets.json` |
| Add Ticket Check-ins | `POST /API/v2/tickets/add-ticket-checkins.json` |
| Add Tickets | `POST /API/v2/tickets/add-tickets.json` |
| Edit Tickets | `POST /API/v2/tickets/edit-tickets.json` |
| Get Canned Response Counts | `GET /API/v2/tickets/questions/canned-response-counts.json` |
| Get Window Checked-In Counts | `GET /API/v2/tickets/checkin/get-ticket-window-checked-in-counts.json` |
| Get Ticket Event Store Info | `GET /API/v2/tickets/get-ticket-event-store-info.json` |
| Get Ticket Event Store Purchases | `GET /API/v2/tickets/get-ticket-event-store-purchases.json` |
| Store Fulfillment | `POST /API/v2/tickets/store/fulfillment.json` |

---

## Volunteers

| Method | Endpoint |
|---|---|
| Get Race Volunteers | `GET /API/v2/volunteers/get-race-volunteers.json` |
| Get Race Volunteer Tasks | `GET /API/v2/volunteers/get-race-volunteer-tasks.json` |
| Get Race Volunteer Questions | `GET /API/v2/volunteers/get-race-volunteer-questions.json` |
| Edit Volunteers | `POST /API/v2/volunteers/edit-volunteers.json` |
| Get Removed Race Volunteers | `GET /API/v2/volunteers/get-removed-race-volunteers.json` |

---

## Race Photos

| Method | Endpoint |
|---|---|
| Get Race Photos | `GET /API/v2/photos/get-race-photos.json` |
| Get Race Photo Albums | `GET /API/v2/photos/get-race-photo-albums.json` |

---

## Race Store

| Method | Endpoint |
|---|---|
| Get User Purchase | `GET /API/race/:race_id/store/user-purchase/:user_id` |

---

## Custom Results Page

| Method | Endpoint |
|---|---|
| Get Custom Results | `GET /API/race/:race_id/custom-results` |
| Create/Edit Custom Results | `POST /API/race/:race_id/custom-results` |
| Delete Custom Results | `DELETE /API/race/:race_id/custom-results` |

---

## User Information

| Method | Endpoint |
|---|---|
| Get Users | `GET /API/users` |
| Get User | `GET /API/user/:user_id` |
| Create User | `POST /API/user` |
| Edit User | `POST /API/user/:user_id` |
| Get Timers | `GET /API/user/timers` |

---

## User Registrations

| Method | Endpoint |
|---|---|
| Get Registered Races | `GET /API/user/registered-races` |

---

## Club Memberships

| Method | Endpoint |
|---|---|
| Get Club Members | `GET /API/club/:club_id/members` |
| Get My Memberships | `GET /API/club/memberships/mine` |
| Get My Club Membership | `GET /API/club/:club_id/members/mine` |

---

## Basic Club Information

| Method | Endpoint |
|---|---|
| Get Club Info | `GET /API/club/:club_id` |

---

## Donation Websites

| Method | Endpoint |
|---|---|
| Get Donation Website | `GET /API/v2/donation-websites/get-donation-website.json` |
| Get Donations | `GET /API/v2/donation-websites/get-donations.json` |
| Get Campaign Fundraisers | `GET /API/v2/donation-websites/get-campaign-fundraisers.json` |
| Get Donation Campaigns | `GET /API/v2/donation-websites/get-donation-campaigns.json` |
| Get Donation Forms | `GET /API/v2/donation-websites/get-donation-forms.json` |

---

## Super Partners

| Method | Endpoint |
|---|---|
| Get Partners | `GET /API/v2/super-partners/partners.json` |
