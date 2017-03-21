var http = require("http");
var uuid = require("uuid");
var url = require("url");

var ame = require("./fims-ame-rest-api.js");
var configuration = require("./configuration.js");

var port = process.argv[2] || 8888;

console.log("Starting");

var config = configuration.load();

http.createServer(function (request, response) {
    var body = null;

    request.on("data", function (data) {
        if (body === null) {
            body = data;
        } else {
            body += data;
        }
    });

    request.on("end", function () {
        var requestId = uuid.v4();

        var requestUrl = url.parse(request.url, true, true);

        var event = {
            resource: "/{proxy+}",
            path: requestUrl.pathname,
            httpMethod: request.method,
            headers: request.headers,
            queryStringParameters: requestUrl.query,
            pathParameters: {
                proxy: requestUrl.pathname.substring(1),
            },
            stageVariables: {
                TableName: config.tableName
            },
            requestContext: {
                accountId: "123456789012",
                resourceId: "abcdef",
                stage: config.restApiStageName,
                requestId: requestId,
                identity: {
                    cognitoIdentityPoolId: null,
                    accountId: null,
                    cognitoIdentityId: null,
                    caller: null,
                    apiKey: null,
                    sourceIp: "127.0.0.1",
                    accessKey: null,
                    cognitoAuthenticationType: null,
                    cognitoAuthenticationProvider: null,
                    userArn: null,
                    userAgent: request.headers["user-agent"],
                    user: null
                },
                resourcePath: "/{proxy+}",
                httpMethod: request.method,
                apiId: "abcdefghij"
            },
            body: body,
            isBase64Encoded: false
        }

        var context = {
            callbackWaitsForEmptyEventLoop: true,
            logGroupName: "/aws/lambda/lambda-function",
            logStreamName: "2017/01/01/[$LATEST]01234567890abcdefg0123457890abcd",
            functionName: "lambda-function",
            memoryLimitInMB: "128",
            functionVersion: "$LATEST",
            invokeid: requestId,
            awsRequestId: requestId,
            invokedFunctionArn: "arn:aws:lambda:us-east-1:123456789012:function:lambda-function"
        };

        ame.handler(event, context, function (err, data) {
            response.writeHead(data.statusCode, data.headers);
            response.write(data.body)
            response.end();
            return;
        });
    });
}).listen(parseInt(port, 10));

console.log("Local API Gateway running at => http://localhost:" + port + "/\nCTRL + C to shutdown");
