// Import (CommonJS) two named exports from the AWS SDK v3 STS package.
// - STSClient: a client object that knows how to talk to AWS STS (Security Token Service)
// - GetCallerIdentityCommand: a “command” object representing the API call we want to make
const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");

// Define an async function so we can use `await` inside it.
// `async` means the function returns a Promise behind the scenes.
async function main() {
    // Create an STS client instance.
    // We pass an empty config `{}` so the SDK uses defaults:
    // - Region: from env vars, profile config, or SDK defaults
    // - Credentials: from the default credential provider chain (env vars, shared config, etc.)
    const client = new STSClient({});

    // Build a command object for the specific STS API call "GetCallerIdentity".
    // The `{}` here means "no parameters needed for this call".
    const command = new GetCallerIdentityCommand({});

    // Send the command using the client.
    // `client.send(...)` returns a Promise, and `await` pauses until it resolves.
    // The resolved value `res` is the response object from AWS.
    const res = await client.send(command);

    // Log the important parts of the response in a readable way.
    // `res.Account`, `res.UserId`, `res.Arn` are fields returned by STS.
    // This is the “who am I authenticated as?” proof for the lab.
    console.log("CallerIdentity:", {
        Account: res.Account, // AWS account ID
        UserId: res.UserId,   // unique identifier for the principal/session
        Arn: res.Arn,         // ARN of the user/role the SDK is using
    });
}

// Call `main()` to actually run the code.
// Because `main()` is async, it returns a Promise.
// `.catch(...)` handles any errors (like “invalid credentials”, “access denied”, etc.).
main().catch((err) => {
    // Print a clear error message so debugging is easier.
    console.error("GetCallerIdentity failed:", err);

    // Exit with a non-zero status code so scripts/CI can detect failure.
    // `1` is a conventional “generic error” exit code.
    process.exit(1);
});