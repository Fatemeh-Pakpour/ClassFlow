# Infrastructure

- `config`: startup environment validation.
- `database`: Nest wiring for the shared database package and pool lifecycle.
- `health`: operational HTTP probe and its database indicator.

Add `messaging`, `cache` or `observability` when an implemented adapter needs them.
Keep business decisions inside business modules. Infrastructure must not import
private business services; the health controller uses the identity module's public
route decorator as an explicit exception.

DatabaseModule exports the DATABASE injection token. Consumers explicitly import
DatabaseModule and inject that token; the connection is not global. Its private
DatabaseConnection provider owns one pool and closes it in onApplicationShutdown.
Process signal listeners are registered in main.ts, separate from HTTP setup.
