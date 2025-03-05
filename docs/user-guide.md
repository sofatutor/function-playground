# Geo-Playground User Guide

## Introduction

Geo-Playground is an interactive web application for creating and manipulating geometric shapes. It provides a canvas where you can draw, move, resize, and rotate various shapes, as well as measure their properties.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Creating Shapes](#creating-shapes)
4. [Selecting Shapes](#selecting-shapes)
5. [Manipulating Shapes](#manipulating-shapes)
6. [Measuring Shapes](#measuring-shapes)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Tips and Tricks](#tips-and-tricks)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

To run Geo-Playground locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/geo-playground.git
   cd geo-playground
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum screen resolution: 1024x768

## Interface Overview

The Geo-Playground interface consists of several main areas:

### Toolbar

Located at the top of the screen, the toolbar contains buttons for:
- Creating different types of shapes
- Selecting shapes
- Moving shapes
- Resizing shapes
- Rotating shapes
- Deleting shapes

### Canvas

The main drawing area where shapes are created and manipulated. The canvas includes:
- A grid for alignment
- Rulers for measurement
- Handles for resizing and rotating shapes

### Properties Panel

Located on the right side of the screen, the properties panel displays information about the selected shape(s) and allows you to edit their properties, such as:
- Position
- Size
- Rotation
- Fill color
- Stroke color
- Stroke width

## Creating Shapes

To create a shape:

1. Click on the shape tool in the toolbar (Circle, Rectangle, Triangle, or Line)
2. Click on the canvas to place the shape
3. Drag to set the size of the shape
4. Release to complete the shape

### Circle

1. Click the Circle tool
2. Click on the canvas where you want the center of the circle
3. Drag outward to set the radius
4. Release to complete the circle

### Rectangle

1. Click the Rectangle tool
2. Click on the canvas where you want the top-left corner of the rectangle
3. Drag to set the width and height
4. Release to complete the rectangle

### Triangle

1. Click the Triangle tool
2. Click on the canvas to place the first point
3. Click again to place the second point
4. Click a third time to place the final point and complete the triangle

### Line

1. Click the Line tool
2. Click on the canvas to place the start point
3. Drag to the end point
4. Release to complete the line

## Selecting Shapes

To select a shape:

1. Click the Select tool in the toolbar
2. Click on a shape to select it
3. Hold Shift and click on multiple shapes to select them all

To deselect shapes:
- Click on an empty area of the canvas
- Press Escape

## Manipulating Shapes

### Moving Shapes

To move a shape:

1. Select the shape(s)
2. Click and drag the shape to the desired position
3. Release to place the shape

### Resizing Shapes

To resize a shape:

1. Select the shape
2. Click and drag one of the resize handles (small squares around the shape)
3. Release to set the new size

Hold Shift while resizing to maintain the aspect ratio.

### Rotating Shapes

To rotate a shape:

1. Select the shape
2. Click and drag the rotation handle (circle above the shape)
3. Release to set the new rotation

Hold Shift while rotating to snap to 15-degree increments.

### Deleting Shapes

To delete a shape:

1. Select the shape(s)
2. Press Delete or Backspace
3. Alternatively, click the Delete button in the toolbar

## Measuring Shapes

The properties panel displays measurements for the selected shape:

### Circle
- Radius
- Diameter
- Circumference
- Area

### Rectangle
- Width
- Height
- Perimeter
- Area

### Triangle
- Side lengths
- Angles
- Perimeter
- Area

### Line
- Length
- Angle

## Keyboard Shortcuts

Geo-Playground supports the following keyboard shortcuts:

| Shortcut       | Action                   |
|----------------|--------------------------|
| Ctrl+C         | Copy selected shape(s)   |
| Ctrl+V         | Paste shape(s)           |
| Ctrl+X         | Cut selected shape(s)    |
| Ctrl+Z         | Undo                     |
| Ctrl+Y         | Redo                     |
| Delete         | Delete selected shape(s) |
| Escape         | Deselect all shapes      |
| Ctrl+A         | Select all shapes        |
| Ctrl++         | Zoom in                  |
| Ctrl+-         | Zoom out                 |
| Ctrl+0         | Reset zoom               |
| Arrow keys     | Move selected shape(s)   |
| Shift+Arrow    | Move by larger increment |
| R              | Activate Rectangle tool  |
| C              | Activate Circle tool     |
| T              | Activate Triangle tool   |
| L              | Activate Line tool       |
| S              | Activate Select tool     |
| M              | Activate Move tool       |

## Tips and Tricks

### Precise Positioning

- Hold Ctrl while moving a shape to constrain movement to horizontal or vertical
- Use the arrow keys for pixel-perfect positioning
- Enable the grid and snap-to-grid feature for alignment

### Working with Multiple Shapes

- Group shapes (Ctrl+G) to move and transform them together
- Use alignment tools to align multiple shapes (top, bottom, left, right, center)
- Use distribution tools to evenly space multiple shapes

### Performance Optimization

- For complex drawings with many shapes, consider grouping shapes that don't need individual manipulation
- Use layers to organize your drawing and hide/show different parts as needed
- Save your work regularly using the export feature

## Troubleshooting

### Common Issues

#### Shapes Not Selecting
- Ensure you're using the Select tool
- Check if the shape is on a locked layer
- Try zooming in if the shape is very small

#### Unexpected Behavior When Resizing
- Check if snap-to-grid is enabled
- Ensure you're dragging the correct handle
- Try disabling any constraints that might be affecting the resize operation

#### Performance Issues
- Reduce the number of shapes on the canvas
- Close other browser tabs and applications
- Try using a different browser
- Clear your browser cache

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [FAQ](https://github.com/yourusername/geo-playground/wiki/FAQ) for common questions
2. Search for similar issues in the [GitHub Issues](https://github.com/yourusername/geo-playground/issues)
3. Create a new issue with detailed steps to reproduce the problem
4. Contact support at support@geo-playground.com 