const testSuiteId: string = process.params.testSuiteId
const key_id: string = process.env.AUTOMATOR_USER_KEY_ID
const secret: string = process.env.AUTOMATOR_SECRET

function getAuthToken(): any {
  const params = {
      Uri         : "https://canary-api.deepcrawl.com/",
      Method      : 'Post',
      Body        : JSON.stringify({"query" : `mutation { createSessionUsingUserKey(input: {userKeyId:"${key_id}", secret:"${secret}"}) { token }}`}),
      ContentType : "application/json"
  }

  const response = runRequest(params); // replace with proper requester

  return response.data.createSessionUsingUserKey.token
}

function deleteAuthToken(token: string): any {
  const params = {
      Uri         : "https://canary-api.deepcrawl.com/",
      Method      : 'Post',
      Body        : JSON.stringify({"query" : "mutation { deleteSession { token }}"}),
      ContentType : "application/json",
      Headers     : {
          'X-Auth-Token' : token
      }
  }

  const response = runRequest(params); // replace with proper requester

  return response.data.deleteSession.token
}

const token = getAuthToken()

interface StartRequestBody {
    authToken  : string,
    testSuiteId : string
}

const startRequestBody: StartRequestBody = {
    authToken  : token,
    testSuiteId : testSuiteId
}

let totalRunTime = 0
const maxRunTime = 3000

let testResults: any;

function getResults(Uri, BuildId): any {
    try {
        const bodyPoll = {
            authToken : token,
            buildId   : buildId
        }

        params = @{
            Uri         = $Uri
            Method      = 'Post'
            Body        = ($bodyPoll | ConvertTo-Json)
            ContentType = "application/json"

        }

        $resultResponse = Invoke-RestMethod @params;

        return $resultResponse
    }
    catch (e) {
        console.warn(`An exception was caught: ${e}`);
        process.exit(1)
    }
}

function writeResults(resultsData) {
    console.info(resultsData)
    if (testResults.passed === true) {
        console.log("DeepCrawl Tests Passed")
        process.exit(0)
    }
    else {
        console.log("DeepCrawl Tests Failed")
        process.exit(1)
    }
}

function startPoll(BuildId) {
    testResults = getResults("https://beta-triggers.deepcrawl.com/poller", BuildId);
    if ( testResults.name === "passed") {
        writeResults(testResults)
    }
    else {
        console.log("Waiting for DeepCrawl Test Results ...")
    }
}

function startBuild {

    const params = {
        Uri         : "https://beta-triggers.deepcrawl.com/start",
        Method      : 'Post',
        Body        : JSON.stringify(startRequestBody),
        ContentType : "application/json"

    }

    const triggerResponse = {};//Invoke-RestMethod @params;
    console.log(triggerResponse);

    if(testResults) {

    } else {
        startPoll(triggerResponse.buildId)
        totalRunTime += 30
    }
    
}

startBuild()

deleteAuthToken(token)