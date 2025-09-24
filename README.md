# Telegram Report Bot

A TypeScript-based Telegram bot for managing spreadsheet connections, generating reports, and interacting with users through text commands and inline keyboards. The bot supports user authentication via connection keys, dynamic report scheduling, and admin commands for database management. It integrates with PostgreSQL for persistent storage, Redis for state and message management, and an external GAS API for connection verification.

## Features

- **User Commands**: `/start` and `/menu` to initialize and navigate the main menu.
- **Connection Management**: Add, rename, or remove spreadsheet connections using unique keys.
- **Report Generation**: Generate reports instantly or schedule them via inline buttons.
- **State-Based Input**: Handle user input for connection keys or titles based on Redis states.
- **Admin Commands**: Manage users, connections, and migrations with `/admin__` commands.
- **Inline Keyboards**: Dynamic buttons for navigation, connection actions, and report scheduling.
- **Message Handling**: Send, edit, and delete messages with text, images, and keyboards.
- **Callback Processing**: Process button clicks to trigger actions like report generation or connection editing.

## Tech Stack

- **Telegram Bot API**: Via `node-telegram-bot-api` for bot interactions.
- **PostgreSQL**: Via `pg` for storing users and connections.
- **Redis**: Via `ioredis` for user state and message storage.

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/johnantonov/10x-inner-bot.git
   cd 10x-inner-bot
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:

   Create a `.env` file in the project root:

   ```env
   TELEGRAM_TOKEN=your_bot_token
   PASS_CHECKER_URL=https://script.google.com/macros/s/AK..../exec
   ADMIN_CHAT=123456789,987654321
   SS_ALL_DATA_URL=https://script.google.com/macros/s/AK..../exec
   BTLZ_TOKEN=eyJhbGciOiJI..
   PGUSER=
   PGHOST=
   PGNAME=
   PGPASS=
   BASE_PORT=3001
   ```

4. **Set Up Database**:

   - Use src/db/migrations folder for set up.
   - Create tables for `users` and `connections` (models in `db/users.model.ts` and `db/connections.model.ts`).
   - Run any migrations using `/admin__db_migrate_{step}`.

5. **Compile TypeScript**:

   ```bash
   npm run build
   ```

6. **Start the Bot**:

   ```bash
   npm start
   ```

   Logs `Bot started successfully!` on successful startup.

## Usage

### User Commands

- `/start`: Initializes the bot and shows the main menu.
- `/menu`: Displays the main menu with options to manage connections or reports.

### Admin Commands

- `/admin__run_report_service`: Runs the report service for the previous hour.
- `/admin__run_report_service_hour_{number}`: Runs reports for a specific hour.
- `/admin__clean_db_{tableName}`: Clears a database table (e.g., `users`, `connections`).
- `/admin__delete_user_{id}`: Deletes a user by chat ID.
- `/admin__help`: Lists all admin commands.
- `/admin__db_migrate_{step}`: Executes database migrations.
- `/admin__send_all_data`: Sends all user data to a spreadsheet.
- `/admin__add_to_blacklist_{ss}_{username}`: Adds user to blacklist for spreadsheet.
- `/admin__remove_from_blacklist_{ss}_{username}`: Removes user from blacklist for spreadsheet.

### Inline Keyboards

- **Main Menu** (`mainOptions`):
  - View connections (`MyConnections`).
  - Generate all reports (`GetAllReportsNow`).
  - Set report schedule (`ChangeTime`).
  - Add new connection (`RegistrateUser` for new users).
- **Connection Menu** (`connectionOptions`):
  - Generate report (`GetReportNow`).
  - Edit report products (`EditReportProducts`).
  - Rename connection (`EditConnectionTitle`).
  - Disconnect or delete (`OffTable`, `OffConnection`).
- **Time Selection** (`generateReportTimeButtons`): Pick report times (9:00–24:00).
- **Yes/No** (`yesNo`): Confirm or cancel actions.

### State-Based Interactions

- **Connection Key**: When prompted (states `AwaitingPremPass` or `AwaitingNewConnection`), enter a key (usually - ss_id).
- **Connection Title**: Enter a custom name when prompted (state `AwaitingConnectionTitle`).

## Architecture

### Key Components

- **`src/bot.ts`**:

  - Initializes `TelegramBot`, `RedisService`, and `MessageService`.
  - Listens for `callback_query` (via `handleCallbackQuery`) and `message` events (via `handleTextMessage` or `handleAdminCommand`).
  - Sets bot commands (`/menu`) via `setBotCommands`.

- **`src/handlers/text.handler.ts`**:

  - Handles text messages:
    - `/start` and `/menu`: Clears state and shows the main menu.
    - State-based input: Calls `handleAwaitingInput` for Redis states.
  - Manages messages (save, edit, delete) using `MessageService`.

- **`src/handlers/awaiting.handler.ts`**:

  - Processes user input for Redis states:
    - `AwaitingPremPass`: Validates connection key, adds connection, updates user type.
    - `AwaitingNewConnection`: Validates key, adds connection.
    - `AwaitingConnectionTitle`: Updates connection title.
  - Uses `Axios` to verify keys via `PASS_CHECKER_URL`.

- **`src/components/buttons.component.ts`**:

  - Defines `CallbackAction` enum (e.g., `Menu = 'menu'`, `GetReportNow = 'grn'`).
  - Generates inline keyboards (`mainOptions`, `connectionOptions`, `generateConnectionsButtons`).
  - Supports pagination for connections and report times.

- **`src/services/message.service.ts`**:

  - Singleton service for Telegram message operations (send, edit, delete).
  - Stores messages in Redis and handles images with captions.
  - Uses `FormData` for media uploads.

- **`src/callback.processor.ts`**:

  - Maps `callback_data` to action strings (e.g., `"menu"`, `"report now"`).
  - Used in `callback.handler.ts` to process button clicks.

- **Other Files**:
  - `src/handlers/admin.handler.ts`: Processes `/admin__` commands.
  - `src/handlers/callback.handler.ts`: Handles callback queries, likely using `CallbackProcessor`.
  - `src/services/redis.service.ts`: Manages Redis operations (e.g., `getUserState`, `deleteUserState`).
  - `src/db/users.model.ts` & `connections.model.ts`: Database models for users and connections.
  - `src/config/env.config.ts`: Loads environment variables.
  - `src/utils/string.utils.ts`: Utility functions (e.g., `formatError`, `getFormatReportTitle`).
  - `src/components/common-answers.component.ts`: Common responses (e.g., `handleStartMenu`).
  - `src/types/*.ts`: Type definitions (`UserMessage`, `AwaitingAnswer`, `ImageType`).

### Workflow

1. **Startup** (`bot.ts`):
   - Initializes services and sets up event listeners.
2. **Text Messages** (`text.handler.ts`):
   - Routes `/start`, `/menu`, or state-based input to appropriate handlers.
3. **State Input** (`awaiting.handler.ts`):
   - Validates and processes connection keys or titles, updating the database.
4. **Button Clicks** (`callback.handler.ts`):
   - Processes `CallbackAction` values, likely using `CallbackProcessor`.
5. **Message Management** (`message.service.ts`):
   - Sends/deletes/edits/ messages with keyboards or images.
6. **Database/Redis**:
   - Stores user/connection data in PostgreSQL and states/messages in Redis.

## Environment Variables

| Variable           | Description                         | Required |
| ------------------ | ----------------------------------- | -------- |
| `TELEGRAM_TOKEN`   | Telegram Bot Token from BotFather   | Yes      |
| `PASS_CHECKER_URL` | API for connection key verification | Yes      |
| `ADMIN_CHAT`       | Comma-separated admin chat IDs      | Yes      |
| `SS_ALL_DATA_URL`  | Spreadsheet data endpoint           | Yes      |
| `PGUSER`           | For PG connection                   | Yes      |
| `PGHOST`           | For PG connection                   | Yes      |
| `PGNAME`           | For PG connection                   | Yes      |
| `PGPASS`           | For PG connection                   | Yes      |
| `BASE_PORT`        | Server port                         | No       |
