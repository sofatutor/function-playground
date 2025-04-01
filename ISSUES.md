# KNOW ISSUES

1. When arrow key moving shapes while the grid is zoomed, the shapes do not move by grid sub line, but the move is not affected by the scale factor.
1. The area to select shapes seems to be much smaller than the actual shape making it very hard to select them properly. That means it will be hard to select the measurement display as you saw.

## Resolution

### Go test driven

For each of the issues, we will create an e2e test (making sure not to duplicate any tests, adding to existing files if it makes sense). The tests are describing the desired behavior, but they will fail due to the issues being replicated.

We will then fix the issue and confirm the fix using the e2e test.
