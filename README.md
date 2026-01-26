# OCR System

This repository contains a **full-stack OCR system** composed of:

- **Backend API** (NestJS + Prisma)
- **Frontend Web App** (Next.js)

The system allows users to:

- Upload documents (PDF / images)
- Extract text via OCR
- Chat with the document using an LLM
- Download documents with extracted text and interactions

---

## Project Structure

```
ocr-system/
│
├── api/                # Backend (NestJS + Prisma)
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── pnpm-lock.yaml
│
├── web/                # Frontend (Next.js)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   └── pnpm-lock.yaml
│
└── README.md
```

---

## Requirements

- **Node.js**: v24.13.0
- **pnpm**: v10.28.0
- **Docker** and **Docker Compose**

---

## 🚀 Local Setup

### 1. Clone the repository

```bash
$ git clone git@github.com:th92rodr/ocr-system.git
$ cd ocr-system
```

---

### 2. Start the Backend using Docker (it will start the API, PostgreSQL database, and local storage)

The application will use the `.env.docker` file as environment variables.

If `NODE_ENV=development`, files are stored locally.  
If `NODE_ENV=production`, files are stored in a Supabase cloud storage, and it is required to fill the Supabase env fields.

It is required to fill the `GROQ_API_KEY` field to connect to Groq LLM.  
It is also possible to change the LLM model used by updating the `LLM_MODEL` environment variable.

```bash
$ cd api/
$ docker compose up --build --detach
```

The API will run at: `http://localhost:3000`

To stop the Backend (API, Database, and local storage):

```bash
$ docker compose down --volumes
```

---

### 3. Start the Frontend

It is required a `.env.local` file with a `NEXT_PUBLIC_API_URL` env variable to be inside the `web` folder.

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

```bash
$ cd web/
$ cp .env.example .env.local
$ pnpm install
$ pnpm build
$ pnpm start --port 8080
```

The frontend will run at: `http://localhost:8080`

---

## License

This project is licensed under the [MIT License](LICENSE.md).

---

## Author

[**@th92rodr**](https://github.com/th92rodr)
