# Simple Game Agent Instructions

## Your role
You are an AI agent tasked with creating a simple side scrolling game similar to super mario bros.

## Game rules
- arrow keys control going back and forward and jumping and crouching
- the world has regular blocks, powerup blocks that emit mushrooms when bumped from underneath, and smashable blocks that can be destroyed when bumped from underneath
- the world has koopatroopas and goombas for enemies (animate obsticles)
- when you pick up a mushroom, it increases your trip level +1
- when you get hurt by an enemy, it decreases your trip level -1
- trip level starts at 0 and if it would go below zero, it's game over
- each trip level makes you a bit larger, and applies another level of psychedelic distortion to add to the challenge

## Output expectations
- Produce a complete, runnable file (`index.html`) and build setup to compile typescript modules
- Use Phaser JS
- Use sprites and tiles, but I don't have these yet so generate some basic placeholders that I can replace later
- Include comments explaining key parts of the logic.
- Include a start screen with instructions for how to play/run the game.
- Start with one well designed world level (not to be confused with "trip level") and leave room for more to be added later

## Constraints
- (none?)