const { exec } = require("child_process");

const Docker = require("dockerode");

const si = require("systeminformation");

const express = require("express");

const cors = require("cors");

const axios = require("axios");

const docker = new Docker();

const app = express();

app.use(cors());

app.use(express.json());

/* STORAGE */

let promptVersions = [];

let aiLogs = [];

let aiRequests = 0;

let version = 1;

/* HOME */

app.get("/", (req, res) => {

  res.send("DevGenAI Backend Running");

});

/* AI ASSISTANT */

app.post("/ask-ai", async (req, res) => {

  aiRequests++;

  const start = Date.now();

  try {

    const response = await axios.post(

      "http://127.0.0.1:11434/api/generate",

      {

        model: "tinyllama",

        prompt: req.body.message,

        stream: false

      }

    );

    const end = Date.now();

    aiLogs.push({

      prompt: req.body.message,

      responseTime: end - start,

      status: "success"

    });

    res.json({

      reply: response.data.response
        .replace(/```/g, "")
        .replace(/\n/g, "\n\n")

    });

  } catch (error) {

    aiLogs.push({

      prompt: req.body.message,

      status: "failed"

    });

    res.status(500).json({

      reply: "AI Backend Failed"

    });

  }

});

/* AI MONITOR */

app.get("/ai-monitor", (req, res) => {

  res.json({

    totalRequests: aiRequests,

    status: "AI Running"

  });

});

/* AI LOGS */

app.get("/ai-logs", (req, res) => {

  res.json(aiLogs);

});

/* SAVE PROMPT */

app.post("/save-prompt", (req, res) => {

  const newPrompt = {

    id: Date.now(),

    version: version++,

    prompt: req.body.prompt,

    date: new Date()

  };

  promptVersions.push(newPrompt);

  res.json({

    success: true,

    prompts: promptVersions

  });

});

/* GET PROMPTS */

app.get("/prompts", (req, res) => {

  res.json(promptVersions);

});

/* ROLLBACK */

app.post("/rollback", (req, res) => {

  if (promptVersions.length > 0) {

    promptVersions.pop();

  }

  res.json({

    success: true,

    prompts: promptVersions

  });

});

/* SYSTEM STATS */

app.get("/system-stats", async (req, res) => {

  try {

    const cpu = await si.currentLoad();

    const memory = await si.mem();

    const os = await si.osInfo();

    res.json({

      cpu: cpu.currentLoad.toFixed(2),

      ram: (
        memory.active /
        1024 /
        1024 /
        1024
      ).toFixed(2),

      totalRam: (
        memory.total /
        1024 /
        1024 /
        1024
      ).toFixed(2),

      platform: os.platform,

      hostname: os.hostname

    });

  } catch (error) {

    res.json({

      error: "Failed to load system stats"

    });

  }

});

/* DOCKER MONITORING */

app.get("/docker-stats", async (req, res) => {

  try {

    const containers =
      await docker.listContainers({
        all: true
      });

    const formatted =
      containers.map((container) => ({

        id:
          container.Id.slice(0,12),

        image:
          container.Image,

        state:
          container.State,

        status:
          container.Status,

        names:
          container.Names[0]
            .replace("/", "")

      }));

    res.json({

      totalContainers:
        formatted.length,

      containers:
        formatted

    });

  } catch (error) {

    res.json({

      totalContainers: 0,

      containers: [],

      error:
        "Docker not running"

    });

  }

});

/* KUBERNETES MONITORING */

app.get("/kubernetes", (req, res) => {

  exec(

    "kubectl get pods --all-namespaces",

    (error, stdout) => {

      if (error) {

        res.json({

          pods: [],

          error: "Kubernetes not connected"

        });

        return;

      }

      const lines = stdout.split("\n");

      const pods = lines.slice(1).map((line) => {

        const cols = line.trim().split(/\s+/);

        return {

          namespace: cols[0],

          name: cols[1],

          status: cols[3]

        };

      });

      res.json({ pods });

    }

  );

});

/* ALERTS */

app.get("/alerts", (req, res) => {

  res.json({

    alerts: [

      "Kubernetes Healthy",

      "Docker Running",

      "AI Monitoring Active",

      "No Critical Errors"

    ]

  });

});

/* LIVE NOTIFICATIONS */

app.get("/notifications", (req, res) => {

  res.json({

    notifications: [

      "Docker container restarted",

      "CPU usage reached 82%",

      "Kubernetes pod healthy",

      "AI Monitoring Enabled",

      "GitHub Actions Connected"

    ]

  });

});

/* INCIDENT RESOLVER */

app.post("/incident-resolver", async (req, res) => {

  try {

    const issue = req.body.issue;

    const response = await axios.post(

      "http://127.0.0.1:11434/api/generate",

      {

        model: "tinyllama",

        prompt: `
Solve this DevOps issue:

${issue}

Explain:
1. Cause
2. Fix
3. Commands
        `,

        stream: false

      }

    );

    res.json({

      reply: response.data.response

    });

  } catch (error) {

    res.json({

      reply: "Incident Resolver Failed"

    });

  }

});

/* YAML GENERATOR */

app.post("/generate-yaml", async (req, res) => {

  try {

    const prompt = req.body.prompt;

    const response = await axios.post(

      "http://127.0.0.1:11434/api/generate",

      {

        model: "tinyllama",

        prompt: `
Generate:
- Dockerfile
- Kubernetes YAML
- GitHub Actions YAML

For:

${prompt}
        `,

        stream: false

      }

    );

    res.json({

      reply: response.data.response

    });

  } catch (error) {

    res.json({

      reply: "YAML Generation Failed"

    });

  }

});

/* CHATOPS */

app.post("/chatops", async (req, res) => {

  try {

    const message = req.body.message;

    const response = await axios.post(

      "http://127.0.0.1:11434/api/generate",

      {

        model: "tinyllama",

        prompt: `
Convert this task into DevOps commands:

${message}
        `,

        stream: false

      }

    );

    res.json({

      reply: response.data.response

    });

  } catch (error) {

    res.json({

      reply: "ChatOps Failed"

    });

  }

});

/* DOCS GENERATOR */

app.post("/generate-docs", async (req, res) => {

  try {

    const content = req.body.content;

    const response = await axios.post(

      "http://127.0.0.1:11434/api/generate",

      {

        model: "tinyllama",

        prompt: `
Generate DevOps documentation for this:

${content}
        `,

        stream: false

      }

    );

    res.json({

      reply: response.data.response

    });

  } catch (error) {

    res.json({

      reply: "Documentation Failed"

    });

  }

});

/* PROMPTOPS */

app.get("/promptops", (req, res) => {

  res.json({

    prompts: promptVersions

  });

});

/* SERVER */

app.listen(5000, () => {

  console.log("Backend running on port 5000");

});