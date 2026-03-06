# Feature Specification: Tina's Stupid Game — Party Word Game

**Feature Branch**: `001-party-word-game`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "A multi-round party word-guessing game played on phones"

## Clarifications

### Session 2026-03-05

- Q: How do players join the same game session? → A: Room code — host creates a game and gets a short code (e.g., "ABCD"), others enter it to join.
- Q: How is turn order determined within a team? → A: Random — the app randomly selects the next clue-giver from players who haven't gone yet in the current cycle.
- Q: What do non-active players see during a turn? → A: Timer + active player name + round info + words guessed this turn + overall team scores + each word revealed after it's guessed correctly.
- Q: What is the maximum length for a word/saying submission? → A: 50 characters.
- Q: What happens after the game ends? → A: "Play Again" resets the bowl and scores, keeps the same room and players, randomizes new team assignments, and returns to the word submission phase.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Word Submission Phase (Priority: P1)

Players open the app on their phones and submit 3–5 words or short sayings (max 50 characters each) that go into a shared "bowl." Each player submits independently on their own device before the game begins. Players join the game session by entering a short room code created by the host.

**Why this priority**: Without words in the bowl, no gameplay can happen. This is the foundational input for everything else.

**Independent Test**: A single player can open the app, enter a room code, type 3–5 words/sayings, submit them, and see confirmation that their entries are in the bowl.

**Acceptance Scenarios**:

1. **Given** a player opens the app, **When** they create a new game, **Then** they receive a short room code (e.g., "ABCD") to share with other players.
2. **Given** a player has a room code, **When** they enter it and provide their name, **Then** they join the game session and see the word submission screen.
3. **Given** a player is on the submission screen, **When** they enter fewer than 3 words and try to submit, **Then** they are told they need at least 3 entries.
4. **Given** a player is on the submission screen, **When** they enter a word/saying longer than 50 characters, **Then** they are told it exceeds the limit.
5. **Given** a player is on the submission screen, **When** they enter 3–5 words/sayings and submit, **Then** the entries are added to the bowl and they see a confirmation.
6. **Given** a player has submitted their words, **When** they view the lobby, **Then** they can see how many total words are in the bowl and which players have submitted (but not which words).
7. **Given** a player has already submitted, **When** they try to submit again, **Then** they are prevented from adding more (limit enforced per player).

---

### User Story 2 — Game Setup: Teams and Player Order (Priority: P1)

After all players have submitted words, the group sets up teams. Each player selects Team 1 or Team 2 on their own phone. A host or any player can then start the game once teams are set. Turn order within each team is determined randomly by the app.

**Why this priority**: Teams and turn order are required before any round can begin.

**Independent Test**: Players can join teams and see the team rosters before the game starts.

**Acceptance Scenarios**:

1. **Given** all players have submitted words, **When** the game transitions to team setup, **Then** each player sees an option to pick Team 1 or Team 2.
2. **Given** a player selects a team, **When** they confirm, **Then** their name appears on that team's roster visible to all players.
3. **Given** both teams have at least one player, **When** the host starts the game, **Then** Round 1 begins.
4. **Given** one team has zero players, **When** someone tries to start the game, **Then** they are told both teams need at least one player.

---

### User Story 3 — Round 1: Catch-Phrase Style (Priority: P1)

In Round 1, the active player sees a word/saying drawn from the bowl and gives verbal catch-phrase-style clues to their team. A 30-second timer counts down on all players' screens. Non-active players see the timer, active player's name, round info, words guessed this turn, overall team scores, and each word revealed after it's guessed correctly. The active player can mark "Got it" (team earns a point, next word drawn) or "Skip" (word returns to bowl; one skip allowed per player in Round 1). When the timer expires, the current word goes back into the bowl and the turn ends. Play alternates between teams; the app randomly selects the next clue-giver from players who haven't gone yet in the current cycle. Play continues until the bowl is empty.

**Why this priority**: This is the core gameplay loop. The app is not a game without it.

**Independent Test**: Two teams can play through Round 1 with the timer, scoring, skipping, and turn alternation working correctly until the bowl is emptied.

**Acceptance Scenarios**:

1. **Given** it is a player's turn, **When** they tap "Start Turn," **Then** they see a word/saying and a 30-second countdown begins on all devices.
2. **Given** the active player's team guesses correctly, **When** the active player taps "Got it," **Then** the team earns a point, the word is removed from the bowl, the word is revealed on all players' screens, and a new word appears for the active player (if time remains).
3. **Given** the active player wants to skip, **When** they tap "Skip" and have not yet skipped this round, **Then** the word returns to the bowl and a new word appears.
4. **Given** the active player has already used their one skip in Round 1, **When** they try to skip again, **Then** the skip button is disabled or hidden.
5. **Given** the timer reaches zero, **When** the turn ends, **Then** the current word returns to the bowl and play moves to a randomly selected player on the opposing team.
6. **Given** a player on Team 1 just finished, **When** the turn transitions, **Then** the next clue-giver is randomly selected from Team 2 players who haven't gone yet (or cycles back if all have gone).
7. **Given** the last word in the bowl is guessed, **When** there are no more words, **Then** Round 1 ends and all words are returned to the bowl for Round 2.
8. **Given** a turn is in progress, **When** a non-active player views their screen, **Then** they see the timer, active player's name, round indicator, words guessed this turn, and overall team scores.

---

### User Story 4 — Round 2: Charades (Priority: P2)

Round 2 follows the same structure as Round 1, but the active player must act out the word/saying (charades-style) instead of giving verbal clues. Skipping is NOT allowed in Round 2. The same random turn selection, timer, scoring, and spectator display rules apply.

**Why this priority**: Builds directly on the Round 1 mechanics — same flow, different constraint.

**Independent Test**: After Round 1 completes, Round 2 begins with the bowl refilled. Players can act out words with no skip option and scoring works correctly.

**Acceptance Scenarios**:

1. **Given** Round 2 has started, **When** the active player sees a word, **Then** the UI indicates "Charades — act it out, no talking!"
2. **Given** it is Round 2, **When** a player looks for the skip button, **Then** it is not available.
3. **Given** the timer expires, **When** the turn ends, **Then** the current word returns to the bowl and play moves to the next randomly selected player.

---

### User Story 5 — Round 3: One-Word Clue (Priority: P2)

Round 3 follows the same structure, but the active player may only say ONE word as a clue. Skipping is NOT allowed. Same timer, scoring, random turn selection, and spectator display rules.

**Why this priority**: Final round that completes the three-round game structure.

**Independent Test**: After Round 2 completes, Round 3 begins with the bowl refilled. The UI indicates one-word clue only, no skip, and scoring works.

**Acceptance Scenarios**:

1. **Given** Round 3 has started, **When** the active player sees a word, **Then** the UI indicates "One-Word Clue — say only ONE word!"
2. **Given** it is Round 3, **When** a player looks for the skip button, **Then** it is not available.
3. **Given** the last word in Round 3 is guessed, **When** the bowl is empty, **Then** the game ends.

---

### User Story 6 — End Game and Rematch (Priority: P2)

After Round 3, the game displays the final scores for both teams and announces the winner. Players can start a rematch which resets the bowl and scores, keeps the same room and players, randomizes new team assignments, and returns to the word submission phase.

**Why this priority**: Provides closure, celebrates the winning team, and enables replay without friction.

**Independent Test**: After the bowl empties in Round 3, all players see final scores, the winner, and a "Play Again" option that resets the game with reshuffled teams.

**Acceptance Scenarios**:

1. **Given** Round 3 ends, **When** scores are tallied, **Then** all players see both team scores and the winning team highlighted.
2. **Given** the scores are tied, **When** the game ends, **Then** the result is displayed as a tie.
3. **Given** the game has ended, **When** the host taps "Play Again," **Then** the bowl and scores reset, teams are randomly reshuffled, and all players return to the word submission screen.
4. **Given** a rematch starts, **When** players view the lobby, **Then** the room code remains the same and all previous players are still in the session.

---

### Edge Cases

- What happens if a player closes the app mid-game? **Assumption**: The game state is held in a shared session; the player can rejoin by reopening the app with the same room code. Their pending turn is skipped if they don't return before it's their turn.
- What happens if only one word is left and the player skips it in Round 1? **Assumption**: The word returns to the bowl and the turn ends (timer still governs).
- What if a team has more players than the other? **Assumption**: Turn order still alternates between teams. The smaller team's players will be randomly selected more often per cycle.
- What happens if the active player's phone loses connection? **Assumption**: The timer continues on other devices. If the active player can't mark "Got it," the turn expires when the timer runs out.
- What if the room code is entered incorrectly? **Assumption**: The app shows an error message ("Room not found") and lets the player try again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST allow each player to enter 3–5 words or short sayings (max 50 characters each) before the game begins.
- **FR-002**: The app MUST store all submitted words in a shared "bowl" accessible to the game session.
- **FR-003**: The app MUST support two teams with player self-assignment.
- **FR-004**: The app MUST enforce a 30-second timer per turn, visible on all connected devices.
- **FR-005**: The app MUST display the current word/saying ONLY to the active player (clue-giver).
- **FR-006**: The active player MUST be able to mark a word as "Got it" (correct guess) to score a point and draw the next word.
- **FR-007**: In Round 1, each player MUST be allowed exactly one skip per round. In Rounds 2 and 3, skipping MUST be disabled.
- **FR-008**: When the timer expires or a word is skipped, the word MUST return to the bowl.
- **FR-009**: Turns MUST alternate between teams, with the app randomly selecting the next clue-giver from players who haven't gone yet in the current cycle.
- **FR-010**: When the bowl is emptied, the round MUST end and all words MUST be returned to the bowl for the next round.
- **FR-011**: The app MUST support three rounds: catch-phrase (Round 1), charades (Round 2), one-word clue (Round 3).
- **FR-012**: After Round 3, the app MUST display final scores and declare a winner (or tie).
- **FR-013**: The next player MUST be able to control when their turn starts (tap to begin).
- **FR-014**: The app MUST be responsive and optimized for mobile phone screens.
- **FR-015**: Players MUST join a game session by entering a short room code generated by the host.
- **FR-016**: Non-active players MUST see the timer, active player's name, round info, words guessed this turn, overall team scores, and each word revealed after it's guessed correctly.
- **FR-017**: Each word/saying submission MUST be limited to 50 characters.
- **FR-018**: After the game ends, the host MUST be able to start a rematch that resets the bowl and scores, keeps the same room and players, randomizes new team assignments, and returns to word submission.

### Key Entities

- **Player**: A participant with a name, team assignment, submitted words, skip status per round, and active/waiting state.
- **Bowl**: The shared pool of words/sayings. Drawn from during play; refilled between rounds.
- **Team**: A group of players (Team 1 or Team 2) with a cumulative score.
- **Round**: One of three game phases (catch-phrase, charades, one-word), each consuming the full bowl.
- **Turn**: A 30-second window where one player gives clues and their team guesses.
- **Game Session**: The shared state connecting all players via a room code, holding the bowl, teams, current round, scores, and turn order.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can submit their words and start a game within 2 minutes of everyone joining.
- **SC-002**: The timer is synchronized across all connected devices with less than 1 second of drift.
- **SC-003**: A full 3-round game with 6–10 players and 30–50 words in the bowl can be completed in under 30 minutes.
- **SC-004**: The app is usable on phones with screen widths as small as 320px without horizontal scrolling.
- **SC-005**: Players can understand the rules and start playing without external instructions (UI is self-explanatory).
- **SC-006**: 90% of player interactions (tap "Got it," "Skip," "Start Turn") respond within 300ms on a standard mobile connection.

## Assumptions

- All players are on the same Wi-Fi or have internet connectivity (real-time sync needed).
- Players will be in the same physical room (verbal clues, acting, one-word clues happen in person — the app only manages the bowl, timer, and scoring).
- No user accounts or authentication required — players join by entering a name and room code.
- One player acts as a de facto "host" who can start the game, advance phases, and initiate rematches, but any player can fill this role.
- The app does not enforce that players follow the round rules (e.g., it doesn't detect if someone talks during charades) — it's an honor system with in-person enforcement.
