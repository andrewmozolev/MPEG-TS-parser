# Spalk Tech Test

This repo contains sample files and outputs for the Spalk tech test

### How to run the parser test:
1. - Success test:
    ```bash
    cat test_success.ts | node ./mpegts-parser.js
    ```
   - Failure test:
    ```bash
    cat test_failure.ts | node ./mpegts-parser.js
    ```

2. Check success code
   ```bash
   echo $?
   ```
