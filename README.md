# Geo-Playground

[![Test](https://github.com/mfittko/geo-playground/actions/workflows/test.yml/badge.svg)](https://github.com/mfittko/geo-playground/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/mfittko/geo-playground/badge.svg?branch=main)](https://coveralls.io/github/mfittko/geo-playground?branch=main)

Geo-Playground is an interactive web application for creating and manipulating geometric shapes. It provides a canvas where you can draw, move, resize, and rotate various shapes, as well as measure their properties.

## Features

- Create various shapes (circles, rectangles, triangles, lines)
- Select and manipulate shapes
- Move, resize, and rotate shapes
- Measure shape properties (area, perimeter, etc.)
- Keyboard shortcuts for common operations
- Responsive design
- Zoom controls with keyboard shortcuts for navigation
- Triangle angle and side measurement with interactive editing
- Function plotting with support for:
  - Basic arithmetic operations
  - Trigonometric functions (sin, cos, tan)
  - Logarithmic functions
  - Rational functions
  - Complex composite functions
- Scale shapes with precise controls
- Interactive canvas with grid system
- Point info tool for precise coordinate and function value tracking
- Grid panning/dragging for easy navigation across the canvas

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
- `npm run e2e:ci` - Run end-to-end tests with Playwright in CI mode
- `npm run e2e` - Run end-to-end tests with Playwright in interactive mode

## Deployment

The application is automatically deployed to Vercel when changes are pushed to the main branch.

### Production Deployment
- Production deployment is triggered automatically on pushing to the `main` branch
- The GitHub Actions workflow handles testing and deploying to Vercel
- You can monitor deployment status in the GitHub Actions tab

### Manual Deployment
To deploy manually:

1. Install the Vercel CLI: `npm install --global vercel`
2. Log in to Vercel: `vercel login`
3. Run: `vercel` (for preview) or `vercel --prod` (for production)

### Required Secrets
For the automated deployment to work, add these secrets to your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## Using the Application

### Drawing Shapes
- Use the shape tools (triangle, rectangle, circle) to create shapes on the canvas
- Click and drag to define size and position
- Shapes remain at the drawn position until manually moved

### Manipulating Triangles
- Click on a triangle to select it and view its measurements
- Click directly on angle or side measurements to edit them
- Editing an angle will update the triangle shape while maintaining the sum of angles (180°)
- Editing a side will proportionally adjust the other sides to maintain the triangle's shape

### Function Plotting
- Click the "Plot Formula" button to enter function plotting mode
- Use the "Add Function" button to create a new function
- Enter expressions like `x*x`, `sin(x)`, `log(x)`, `tan(x)`, or complex formulas like `sin(x) * cos(x*2)`
- Supported operations include arithmetic, trigonometric, logarithmic, and rational functions
- Functions update in real-time as you enter them
- Click on points along the function graph to activate the point info panel with precise coordinates and calculations
- Use left/right arrow navigation in the point info panel to move along the function curve with defined step size
- Configure formula parameters with custom ranges and step sizes:
  - Set minimum and maximum values for each parameter
  - Adjust step size for fine-grained control
  - Use sliders for quick parameter adjustments
  - Parameters are automatically detected from the formula expression

### Zoom Controls
- Use the zoom buttons or keyboard shortcuts to zoom in/out
- Arrow Up/Down for zoom control
- Ctrl + '+' to zoom in
- The current zoom level is displayed as a percentage

### Point Info Tool
- View detailed coordinate information by hovering over points on graphs
- See exact X and Y coordinates of any point on a function graph
- View the calculation used to determine the Y value at specific X coordinates
- Navigate between points on a function using arrow controls with customizable step size
- Alt+Click to access additional measurement options

### Grid Navigation
- Click and drag on the empty canvas to pan/move the grid in any direction
- Combine grid dragging with zoom controls for easy navigation across large diagrams
- Grid maintains object positions while allowing you to focus on different areas
- Alt+Click to move only the grid origin without affecting shapes
- Alt+Shift+Click to move both the grid and all shapes together

## Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Jest (for unit testing)
- Playwright (for end-to-end testing)

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

## Testing

The project includes comprehensive testing:

- Unit tests using Jest
- End-to-end tests using Playwright

### End-to-End Testing

E2E tests simulate user interactions to ensure the application works correctly from a user's perspective. 

Running E2E tests:

- `npm run e2e` - Run all E2E tests
- `npm run e2e:ci` - Run E2E tests in CI mode with GitHub reporting
- `npm run e2e:ci:debug` - Run E2E tests with debug logging enabled
- `npm run e2e:open` - Open Playwright UI for interactive testing
- `npm run e2e:debug` - Run tests in debug mode

### Debug Logging

The E2E tests use a debug logging system that suppresses verbose output by default. 
To see detailed logs, use the `e2e:ci:debug` command or set the `DEBUG=true` environment variable.

```bash
# Run with debug logs
npm run e2e:ci:debug

# Or manually set the DEBUG env variable
DEBUG=true npm run e2e:ci
```
