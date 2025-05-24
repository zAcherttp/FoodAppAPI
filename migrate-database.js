#!/usr/bin/env node

/**
 * This script runs the full migration process to separate comments and ratings
 * from recipes into their own tables.
 */

const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to execute commands
function runCommand(command) {
  try {
    console.log(`\nExecuting command: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\nError executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Ask for confirmation
function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main migration function
async function runMigration() {
  console.log('\n=== FOOD APP DATABASE MIGRATION ===');
  console.log('This script will migrate comments and ratings to separate tables');
  
  const proceed = await confirm('Do you want to proceed with the migration?');
  if (!proceed) {
    console.log('Migration cancelled.');
    rl.close();
    return;
  }
  
  console.log('\nStep 1: Building TypeScript files...');
  if (!runCommand('npx tsc')) {
    rl.close();
    return;
  }
  
  console.log('\nStep 2: Running comment and rating migration script...');
  const migrateConfirm = await confirm('This will migrate comments and ratings to separate tables. Continue?');
  if (!migrateConfirm) {
    console.log('Migration stopped.');
    rl.close();
    return;
  }
  
  if (!runCommand('node dist/scripts/migrateCommentsAndRatings.js')) {
    const retry = await confirm('Migration encountered errors. Do you want to continue anyway?');
    if (!retry) {
      rl.close();
      return;
    }
  }
  
  console.log('\nStep 3: Normalizing recipes...');
  const normalizeConfirm = await confirm('This will remove comments and ratings arrays from recipes. Continue?');
  if (!normalizeConfirm) {
    console.log('Normalization skipped.');
    rl.close();
    return;
  }
  
  if (!runCommand('node dist/scripts/normalizeExistingRecipes.js')) {
    console.log('Normalization encountered errors.');
  }
  
  console.log('\n=== MIGRATION COMPLETED ===');
  console.log('Please check the logs above for any warnings or errors.');
  console.log('Remember to update your API endpoints to use the new data structure.');
  rl.close();
}

// Run the migration
runMigration();
