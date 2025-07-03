# Flow State Yoga

## Overview

Flow State – a yoga sequence generator where users can sign up / log in, create, edit, and delete customised yoga sequences.

## Development Setup

To set up and run the Flow State yoga app locally:

**Prerequisites**

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account and project for database and authentication

**Local Setup**

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd flow-state-yoga-builder

# Step 3: Install dependencies
npm i

# Step 4: Set up environment variables
# Create a .env file with your Supabase credentials
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Step 5: Start the development server
npm run dev
```

**Alternative Development Methods**

- **GitHub**: Edit files directly in the browser by clicking the "Edit" button on any file
- **GitHub Codespaces**: Launch a cloud development environment from the "Code" button

## Tech Stack

This project is built with:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- Supabase DB & Auth
- @dnd-kit
- react-router
- TanStack Query

## Deploying the Project

To deploy the project, you can use your preferred service like Vercel, Netlify, or any other static host that supports React applications.

## Connecting a Custom Domain

You can connect a custom domain through your chosen hosting provider's domain settings or DNS management.
