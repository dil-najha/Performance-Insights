// ===============================================
// 🧪 TEST-APP CODE LOADER (ISOLATED FEATURE)
// ===============================================
// This service automatically loads test-app code for AI analysis
// Can be easily enabled/disabled or completely removed

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 🧪 TEST-APP CODE LOADER
 * Automatically loads code from the test-app directory for AI analysis
 * This is an ISOLATED feature that can be easily removed
 */
export class TestAppCodeLoader {
  // 🔧 EASY TOGGLE - Set to false to disable this feature completely
  static FEATURE_ENABLED = true;
  
  // 📁 Test-app directory configuration
  static TEST_APP_CONFIG = {
    baseDir: path.join(__dirname, '../../test-app'),
    
    // 🎯 OPTIMIZED: Only include files with intentional performance issues
    includedFiles: [
      // 🚨 Backend files with critical performance issues
      'backend/server.js',                    // N+1 queries, memory leaks, WebSocket issues
      
      // 🚨 Frontend files with intentional performance problems
      'frontend/src/App.jsx',                 // Heavy computations in render, blocking UI
      'frontend/src/components/Dashboard.jsx', // Excessive state updates, large data processing
      'frontend/src/components/Calendar.jsx',  // Heavy event processing, memory accumulation
      'frontend/src/components/Meetings.jsx',  // Global memory leaks, inefficient rendering
      
      // 📋 Essential configuration for context (lightweight)
      'backend/package.json',                 // Backend dependencies context
      'frontend/package.json'                 // Frontend dependencies context
    ],
    
    // 🎯 File categories for AI context (optimized for performance focus)
    categories: {
      'backend/server.js': 'Backend API Server - Critical Performance Issues',
      'frontend/src/App.jsx': 'Frontend Main Application - Heavy Computations',
      'frontend/src/components/Dashboard.jsx': 'Dashboard Component - State & Data Issues',
      'frontend/src/components/Calendar.jsx': 'Calendar Component - Memory & Processing Issues', 
      'frontend/src/components/Meetings.jsx': 'Meetings Component - Memory Leaks & Rendering',
      'backend/package.json': 'Backend Dependencies Context',
      'frontend/package.json': 'Frontend Dependencies Context'
    }
  };

  /**
   * 🔍 Check if test-app code loading is enabled
   */
  static isEnabled() {
    return this.FEATURE_ENABLED;
  }

  /**
   * 📂 Check if test-app directory exists
   */
  static async isTestAppAvailable() {
    if (!this.FEATURE_ENABLED) return false;
    
    try {
      const stat = await fs.stat(this.TEST_APP_CONFIG.baseDir);
      return stat.isDirectory();
    } catch (error) {
      console.warn('⚠️ Test-app directory not found:', this.TEST_APP_CONFIG.baseDir);
      return false;
    }
  }

  /**
   * 📝 Get language from file extension
   */
  static getLanguageFromPath(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript', 
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.json': 'json',
      '.md': 'markdown'
    };
    return languageMap[ext] || 'text';
  }

  /**
   * 📖 Read a single file safely
   */
  static async readFileContent(filePath) {
    try {
      const fullPath = path.join(this.TEST_APP_CONFIG.baseDir, filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Limit file size for AI processing (max 100KB per file)
      if (content.length > 100000) {
        const truncated = content.substring(0, 100000);
        console.log(`📏 Truncated ${filePath} to 100KB for AI processing`);
        return truncated + '\n\n// ... [File truncated for AI analysis] ...';
      }
      
      return content;
    } catch (error) {
      console.warn(`⚠️ Could not read ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * 🧪 Load all test-app source code for AI analysis
   */
  static async loadTestAppCode() {
    if (!this.FEATURE_ENABLED) {
      console.log('🧪 Test-app code loader is disabled');
      return null;
    }

    // Check if test-app is available
    if (!(await this.isTestAppAvailable())) {
      console.warn('⚠️ Test-app directory not available for code loading');
      return null;
    }

    console.log('🧪 Loading OPTIMIZED test-app source code for AI analysis...');
    console.log(`🎯 Targeting ${this.TEST_APP_CONFIG.includedFiles.length} key files with intentional performance issues`);
    
    const sourceFiles = [];
    let totalSize = 0;

    // Load each configured file
    for (const filePath of this.TEST_APP_CONFIG.includedFiles) {
      const content = await this.readFileContent(filePath);
      
      if (content !== null) {
        const language = this.getLanguageFromPath(filePath);
        const category = this.TEST_APP_CONFIG.categories[filePath] || 'Unknown';
        
        sourceFiles.push({
          path: filePath,
          content: content,
          language: language,
          category: category,
          size: content.length
        });
        
        totalSize += content.length;
        console.log(`  ✅ Loaded ${filePath} (${Math.round(content.length/1024)}KB) - ${category}`);
      }
    }

    if (sourceFiles.length === 0) {
      console.warn('⚠️ No test-app files could be loaded');
      return null;
    }

    console.log(`✅ OPTIMIZED test-app loading completed: ${sourceFiles.length} files, ${Math.round(totalSize/1024)}KB total`);
    console.log('🎯 Focused on critical performance issue files to maximize AI analysis efficiency');

    // Return in SourceCode format compatible with existing AI system
    return {
      files: sourceFiles,
      totalFiles: sourceFiles.length,
      totalSize: totalSize,
      source: 'test-app-auto-loaded', // Identifier for this feature
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 📊 Get test-app loading statistics
   */
  static async getStats() {
    if (!this.FEATURE_ENABLED) {
      return { enabled: false, available: false };
    }

    const available = await this.isTestAppAvailable();
    
    return {
      enabled: this.FEATURE_ENABLED,
      available: available,
      configuredFiles: this.TEST_APP_CONFIG.includedFiles.length,
      baseDirectory: this.TEST_APP_CONFIG.baseDir,
      categories: Object.keys(this.TEST_APP_CONFIG.categories).length
    };
  }

  /**
   * 🧹 Disable feature (for easy reversal)
   */
  static disable() {
    this.FEATURE_ENABLED = false;
    console.log('🧪 Test-app code loader has been disabled');
  }

  /**
   * ✅ Enable feature  
   */
  static enable() {
    this.FEATURE_ENABLED = true;
    console.log('🧪 Test-app code loader has been enabled');
  }
}

// Export for easy feature toggling
// Class is already exported above on line 18: export class TestAppCodeLoader
