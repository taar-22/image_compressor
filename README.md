# Entamizh Image Optimizer

A web-based image optimization tool built for **Entamizh.com**, a Malaysian Indian news platform. The application resizes and compresses uploaded images into a standardized **1200 × 628 px** format for use as WordPress featured images.

## Overview

News websites often receive images in different dimensions and file sizes. This tool simplifies the image preparation process by automatically converting uploaded images into a consistent format suitable for publishing.

The application:

* Accepts image uploads
* Resizes images to **1200 × 628 pixels**
* Compresses images to reduce file size
* Produces publication-ready images for WordPress
* Helps streamline the editorial image-preparation workflow

## Built For

**entamizh.com** — a Malaysian Indian news platform.

The tool was developed to support the site's editorial workflow and is currently used for preparing featured images for news articles.

## Features

* Image upload
* Automatic resizing to 1200 × 628 px
* Image compression
* Optimized output for web publishing
* Simple and lightweight interface
* Suitable for WordPress featured images

## Tech Stack

* [Add your actual frontend technology here]
* [Add your actual backend technology here]
* Image processing library/API: [Add if applicable]

## How It Works

```text
Upload Image
     ↓
Image Processing
     ↓
Resize to 1200 × 628 px
     ↓
Compress Image
     ↓
Download Optimized Image
```

## Running Locally

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd <project-folder>
```

### 2. Install dependencies

Use the installation command appropriate for the project's technology stack.

```bash
# Example
npm install
```

### 3. Configure environment variables

If the application requires environment variables, create a `.env` file based on `.env.example`.

```bash
cp .env.example .env
```

Add the required configuration values to `.env`.

**Do not commit `.env` or any API keys/secrets to GitHub.**

### 4. Start the application

```bash
# Example
npm start
```

The exact command may vary depending on the project configuration.

## Output Format

The application generates images at:

**1200 × 628 pixels**

This format is intended for use as a WordPress featured image.

## Project Structure

```text
project/
├── [source files]
├── [assets]
├── [configuration files]
├── .gitignore
├── .env.example
└── README.md
```

*The structure above should be updated to reflect the final project structure.*

## Use Case

This project was created to solve a practical publishing requirement: preparing differently sized and potentially large images for consistent use across a news website.

Rather than manually resizing and compressing each image, the tool provides a simple workflow for generating standardized, web-ready featured images.

## Author
