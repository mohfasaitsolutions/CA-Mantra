require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cahero', {
  autoIndex: true
});

async function updateEvaluatorSpecializations() {
  try {
    console.log('Updating evaluator specializations...');
    
    // Find the evaluator
    const evaluator = await User.findOne({ 
      email: 'flameosocial@gmail.com',
      role: 'EVALUATOR'
    });
    
    if (!evaluator) {
      console.log('Evaluator not found');
      return;
    }
    
    console.log('Current specializations:', evaluator.specializations);
    
    // Add "Corporate and Other Laws" to specializations if not already present
    const newSpecializations = [...evaluator.specializations];
    if (!newSpecializations.includes('Corporate and Other Laws')) {
      newSpecializations.push('Corporate and Other Laws');
    }
    
    // Update the evaluator
    await User.findByIdAndUpdate(evaluator._id, {
      specializations: newSpecializations
    });
    
    console.log('Updated specializations:', newSpecializations);
    console.log('Evaluator specializations updated successfully!');
    
  } catch (error) {
    console.error('Error updating evaluator:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the update
updateEvaluatorSpecializations();
