const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const path = require("path");

const fs = require("fs");
const util = require("util");
const { spinnerSvg } = require("./spinnerSvg.js");

const expressWs = require("express-ws")(app);

app.use(express.static("public"));

const {
    VertexAI,
    FunctionDeclarationSchemaType
} = require("@google-cloud/vertexai");

// get project and location from metadata service
const metadataService = require("./metadataService.js");

// instance of Gemini model
let generativeModel;

// 1: define the function
const functionDeclarations = [
    {
        function_declarations: [
            {
                name: "getweather",
                description: "get weather for a given location",
                parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                        location: {
                            type: FunctionDeclarationSchemaType.STRING
                        },
                        degrees: {
                            type: FunctionDeclarationSchemaType.NUMBER,
                            "description":
                                "current temperature in fahrenheit"
                        },
                        conditions: {
                            type: FunctionDeclarationSchemaType.STRING,
                            "description":
                                "how the weather feels subjectively"
                        }
                    },
                    required: ["location"]
                }
            }
        ]
    }
];

// on instance startup
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, async () => {
    console.log(`demo1: listening on port ${port}`);

    const project = await metadataService.getProjectId();
    const location = await metadataService.getRegion();

    // Vertex client library instance
    const vertex_ai = new VertexAI({
        project: project,
        location: location
    });

    // Instantiate models
    generativeModel = vertex_ai.getGenerativeModel({
        model: "gemini-pro"
    });
});

const axios = require("axios");
const baseUrl = "https://weatherservice-cxnewkgqua-ew.a.run.app";

app.ws("/sendMessage", async function (ws, req) {

    // this chat history will be pinned to the current 
    // Cloud Run instance. Consider using Firestore &
    // Firebase anonymous auth instead.

    // start ephemeral chat session with Gemini
    const chatWithModel = generativeModel.startChat({
        tools: functionDeclarations
    });

    ws.on("message", async function (message) {
        let questionToAsk = JSON.parse(message).message;
        console.log("WebSocket message: " + questionToAsk);

        ws.send(`<div hx-swap-oob="beforeend:#toupdate"><div
                        id="questionToAsk"
                        class="text-black m-2 text-right border p-2 rounded-lg ml-24">
                        ${questionToAsk}
                    </div></div>`);

        // to simulate a natural pause in conversation
        await sleep(500);

        // get timestamp for div to replace
        const now = "fromGemini" + Date.now();

        ws.send(`<div hx-swap-oob="beforeend:#toupdate"><div
                        id=${now}
                        class=" text-blue-400 m-2 text-left border p-2 rounded-lg mr-24">
                        ${spinnerSvg}
                    </div></div>`);

        const results = await chatWithModel.sendMessage(questionToAsk);

        // Function calling demo
        let response1 = await results.response;
        let data = response1.candidates[0].content.parts[0];

        let methodToCall = data.functionCall;
        if (methodToCall === undefined) {
            console.log("Gemini says: ", data.text);
            ws.send(`<div
                        id=${now}
                        hx-swap-oob="true"
                        hx-swap="outerHTML"
                        class="text-blue-400 m-2 text-left border p-2 rounded-lg mr-24">
                        ${data.text}
                    </div>`);

            // bail out - Gemini doesn't want to return a function
            return;
        }

        // otherwise Gemini wants to call a function
        console.log(
            "Gemini wants to call: " +
                methodToCall.name +
                " with args: " +
                util.inspect(methodToCall.args, {
                    showHidden: false,
                    depth: null,
                    colors: true
                })
        );

        // make the external call
        let jsonReturned;
        try {
            const responseFunctionCalling = await axios.get(
                baseUrl + "/" + methodToCall.name,

                {
                    params: {
                        location: methodToCall.args.location
                    }
                }
            );
            jsonReturned = responseFunctionCalling.data;
        } catch (ex) {
            // in case an invalid location was provided
            jsonReturned = ex.response.data;
        }

        console.log("jsonReturned: ", jsonReturned);

        // tell the model what function we just called
        const functionResponseParts = [
            {
                functionResponse: {
                    name: methodToCall.name,
                    response: {
                        name: methodToCall.name,
                        content: { jsonReturned }
                    }
                }
            }
        ];

        // // Send a follow up message with a FunctionResponse
        const result2 = await chatWithModel.sendMessage(
            functionResponseParts
        );

        // This should include a text response from the model using the response content
        // provided above
        const response2 = await result2.response;
        let answer = response2.candidates[0].content.parts[0].text;
        console.log("answer: ", answer);

        ws.send(`<div
                        id=${now}
                        hx-swap-oob="true"
                        hx-swap="outerHTML"
                        class="text-blue-400 m-2 text-left border p-2 rounded-lg mr-24">
                        ${answer}
                    </div>`);
    });

    ws.on("close", () => {
        console.log("WebSocket was closed");
    });
});

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}