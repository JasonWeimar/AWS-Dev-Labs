const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");

exports.handler = async () => {
    const client = new STSClient({});
    const res = await client.send(new GetCallerIdentityCommand({}));

    console.log("CallerIdentity:", {
        Account: res.Account,
        UserId: res.UserId,
        Arn: res.Arn,
    });

    return {
        ok: true,
        identity: {
            account: res.Account,
            userId: res.UserId,
            arn: res.Arn,
        },
    };
};
