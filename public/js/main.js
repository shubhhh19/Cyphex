// Initialize Three.js background
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Three.js...');
    
    // Logo fallback handling
    const logoImages = document.querySelectorAll('.logo-img');
    const textLogos = document.querySelectorAll('#text-logo');
    
    logoImages.forEach((img, index) => {
        img.addEventListener('error', function() {
            console.log('Logo failed to load, showing text fallback');
            if (textLogos[index]) {
                textLogos[index].style.display = 'inline';
            }
        });
    });
    
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js library not loaded!');
        return;
    }
    
    try {
        // Three.js setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        const canvasContainer = document.getElementById('canvas-container');
        if (!canvasContainer) {
            console.error('Canvas container not found!');
            return;
        }
        
        canvasContainer.appendChild(renderer.domElement);
        console.log('Three.js renderer initialized successfully');
        
        // Create particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1000;
        const posArray = new Float32Array(particlesCount * 3);
        
        for(let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 10;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.02,
            color: 0x00f7ff,
            transparent: true,
            opacity: 0.8
        });
        
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);
        
        camera.position.z = 3;
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            particlesMesh.rotation.x += 0.0005;
            particlesMesh.rotation.y += 0.0005;
            renderer.render(scene, camera);
        }
        
        animate();
        console.log('Three.js animation loop started');
        
        // Handle window resize
        window.addEventListener('resize', function() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
    } catch (error) {
        console.error('Error initializing Three.js:', error);
    }
    
    // Email scan functionality
    const emailInput = document.getElementById('email-input');
    const scanBtn = document.getElementById('scan-btn');
    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('results');
    const homeSection = document.getElementById('home');
    const resultContent = document.getElementById('result-content');
    const newScanBtn = document.getElementById('new-scan');
    const errorMessage = document.getElementById('error-message');
    
    // Handle scan button click
    scanBtn.addEventListener('click', async function() {
        const email = emailInput.value.trim();
        
        if(!email || !validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        hideError();
        loading.classList.remove('hidden');
        
        try {
            const response = await fetch('/api/check-breach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if(response.ok) {
                displayResults(data);
            } else {
                showError(data.error || 'An error occurred. Please try again.');
                loading.classList.add('hidden');
            }
        } catch(error) {
            showError('Unable to connect to the server. Please try again later.');
            loading.classList.add('hidden');
        }
    });
    
    // Handle enter key
    emailInput.addEventListener('keypress', function(e) {
        if(e.key === 'Enter') {
            scanBtn.click();
        }
    });
    
    // New scan button
    if (newScanBtn) {
        newScanBtn.addEventListener('click', function() {
            goBackToHome();
        });
    }
    
    // Function to go back to home
    function goBackToHome() {
        resultsSection.classList.add('hidden');
        homeSection.classList.remove('hidden');
        emailInput.value = '';
        emailInput.focus();
        homeSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Display results
    function displayResults(data) {
        loading.classList.add('hidden');
        homeSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        let html = '';
        
        if(data.breachDetails && data.breachDetails.length > 0) {
            const breachCount = data.breachDetails.length;
            const riskLevel = data.breachScore < 25 ? 'Low' : data.breachScore < 50 ? 'Medium' : data.breachScore < 75 ? 'High' : 'Critical';
            
            html += `
                <div class="mb-6 p-4 bg-gray-900 bg-opacity-50 rounded-lg border border-gray-700">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-red-400">${breachCount}</div>
                            <div class="text-sm text-gray-400">Total Breaches</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-cyan-400">${data.breachScore}/100</div>
                            <div class="text-sm text-gray-400">Risk Score</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-yellow-400">${riskLevel}</div>
                            <div class="text-sm text-gray-400">Risk Level</div>
                        </div>
                    </div>
                </div>
            `;
            
            html += '<h4 class="text-xl font-bold mb-4 text-red-400">BREACH DETAILS</h4>';
            html += '<div class="space-y-4">';
            
            data.breachDetails.forEach(breach => {
                const dataTypesStr = breach.dataTypes.join(', ') || 'Unknown data types';
                
                html += `
                <div class="bg-gray-900 bg-opacity-50 p-4 rounded-lg border border-gray-700">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h5 class="font-bold text-lg text-red-400">${breach.name}</h5>
                            <p class="text-gray-400 text-sm mb-2">${formatDate(breach.date)}</p>
                            <p class="text-gray-300 text-sm mb-2">${breach.description}</p>
                            <p class="text-cyan-300 text-sm">Exposed: ${dataTypesStr}</p>
                            <p class="text-gray-400 text-sm">Domain: ${breach.domain} | Industry: ${breach.industry}</p>
                            <p class="text-yellow-400 text-sm">Password Risk: ${breach.passwordRisk}</p>
                        </div>
                    </div>
                </div>
                `;
            });
            
            html += '</div>';
            
            html += `
            <div class="mt-6 bg-blue-900 bg-opacity-30 p-6 rounded-lg border border-blue-700">
                <h4 class="text-lg font-bold mb-4 text-blue-400">SECURITY RECOMMENDATIONS</h4>
                <ul class="text-gray-300 space-y-2">
                    <li class="flex items-start">
                        <span class="text-blue-400 mr-2">•</span>
                        <span>Change passwords for all accounts using this email address</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-blue-400 mr-2">•</span>
                        <span>Enable two-factor authentication wherever possible</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-blue-400 mr-2">•</span>
                        <span>Use a password manager to generate strong, unique passwords</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-blue-400 mr-2">•</span>
                        <span>Monitor your accounts for suspicious activity</span>
                    </li>
                </ul>
            </div>
            `;
        } else {
            html += `
                <div class="text-center py-8">
                    <div class="text-green-400 text-5xl mb-4">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-green-400 mb-2">No Breaches Found</h3>
                    <p class="text-gray-300">Your email has not been found in any known data breaches.</p>
                    <div class="mt-6 bg-green-900 bg-opacity-30 p-4 rounded-lg">
                        <h4 class="text-lg font-bold mb-2 text-green-400">Keep It Secure</h4>
                        <ul class="text-gray-300 text-sm space-y-1">
                            <li>• Continue using strong, unique passwords</li>
                            <li>• Enable two-factor authentication</li>
                            <li>• Regularly monitor your accounts</li>
                        </ul>
                    </div>
                </div>
            `;
        }
        
        resultContent.innerHTML = html;
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Email validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Format date
    function formatDate(dateStr) {
        if(!dateStr || dateStr === 'Unknown') return 'Date unknown';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    // Error handling
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        emailInput.classList.add('animate-shake');
        setTimeout(() => {
            emailInput.classList.remove('animate-shake');
        }, 500);
    }
    
    function hideError() {
        errorMessage.classList.add('hidden');
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});