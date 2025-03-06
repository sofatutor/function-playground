# Geo-Playground

[![Test](https://github.com/manuelfittko/geo-playground/actions/workflows/test.yml/badge.svg)](https://github.com/mfittko/geo-playground/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/manuelfittko/geo-playground/branch/main/graph/badge.svg)](https://codecov.io/gh/mfittko/geo-playground)

Geo-Playground is an interactive web application for creating and manipulating geometric shapes. It provides a canvas where you can draw, move, resize, and rotate various shapes, as well as measure their properties.

## Features

- Create various shapes (circles, rectangles, triangles, lines)
- Select and manipulate shapes
- Move, resize, and rotate shapes
- Measure shape properties (area, perimeter, etc.)
- Keyboard shortcuts for common operations
- Responsive design

## Project Structure

The application follows a service-based architecture with a clean separation of concerns:

- **Components**: React components for the UI
- **Services**: Shape services for business logic
- **Utilities**: Utility functions for geometry operations
- **Hooks**: Custom React hooks for state management
- **Types**: TypeScript type definitions

## Documentation

Comprehensive documentation is available in the `docs` directory:

- [API Documentation](docs/api-documentation.md): Detailed documentation of the shape services and utilities
- [Architecture Documentation](docs/architecture.md): Overview of the application architecture
- [User Guide](docs/user-guide.md): Guide for end users
- [Code Examples](docs/code-examples.md): Examples and tutorials for developers
- [Refactoring Plan](docs/refactoring-plan.md): The plan and progress of the refactoring effort

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```sh
# Clone the repository
git clone https://github.com/manuelfittko/geo-playground.git
cd geo-playground

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage report

## Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Jest (for testing)

## Recent Improvements

The codebase has recently undergone a major refactoring to improve maintainability, testability, and extensibility:

1. **Service-Based Architecture**: Implemented a service-based architecture for shape operations
2. **Comprehensive Testing**: Added extensive unit tests with >80% code coverage
3. **Improved Type Safety**: Enhanced TypeScript types and added runtime type checking
4. **Better Organization**: Reorganized code into smaller, more focused modules
5. **Comprehensive Documentation**: Added detailed documentation for developers and users

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped improve this project
- Special thanks to the open-source community for the tools and libraries used in this project

## Project info

**URL**: https://lovable.dev/projects/61b9f1ed-c0ae-4354-87f1-e6f0c952760b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/61b9f1ed-c0ae-4354-87f1-e6f0c952760b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/61b9f1ed-c0ae-4354-87f1-e6f0c952760b) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
