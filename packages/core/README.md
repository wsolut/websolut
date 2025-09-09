# Websolut CORE

Utilitary classes to convert Figma Nodes to a JSON format closer to DOM

## How to use it

### 1. Step

```bash
npm add @wsolut/websolut-core --save-dev
```

### 2. Step

Download and extract a zip file inside the **examples** folder, to your project's **scripts** folder.

### 3. Step

Add an entry to your ```package.json``` **scripts** section like so:

```json
"scripts": {
  ...
  "synchronize": "node scripts/synchronize.mjs",
  ...
}
```

### 4. Step

Update the **home** entry of the **figmaFiles** object inside the ```scripts/synchronize.mjs``` with the figma file URL that you want to convert.

### 5. Step

Finally, run:

```bash
FIGMA_TOKEN=<your-figma-token> npm run synchronize home
```

This will convert your figma file using the EJS template files you just downloaded, to the **outDirPath** that is setup inside the ```scripts/synchronize.mjs``` file.

## Development

```bash
git clone https://github.com/wsolut/websolut.git
cd websolut/packages/core
npm install
```

Copy **.env.example** as **.env** and add your own FIGMA TOKEN, FIGMA_FILE_KEY from a figma file and FIGMA_NODE_ID from the node you want to convert.

```bash
cp .env.example .env
```

Then run:

```bash
npm run dev
```

Which will generate files to **out** folder using the EJS template files inside the folder **scripts/templates**.
