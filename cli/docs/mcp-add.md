# Command: `gemini mcp add`

## Description

Registers a new managed server process with the Gemini CLI. This allows you to define a custom tool or server that the CLI can manage.

## Usage

```sh
gemini mcp add [options] <serverName> <command...>
```

## Arguments

*   `<serverName>` (Required): A unique name to identify the server process (e.g., `my-python-tools`).
*   `<command...>` (Required): The full command required to start the server. This should be the executable followed by any necessary arguments.

## Options

*   `-e, --env <KEY=VALUE>`: Sets an environment variable for the server process. This option can be specified multiple times.

## Example

This example registers a Python-based server named `my-python-tools`. It specifies the command to run the server and sets two environment variables (`API_KEY` and `DATABASE_URL`).

```sh
gemini mcp add my-python-tools python -m my_mcp_server --port 8080 -e API_KEY=yourkey -e DATABASE_URL=your_database_connection_string
```
