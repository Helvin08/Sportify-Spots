#!/usr/bin/env node

/**
 * Admin CLI Tool for Membership Management
 * Usage: node admin-cli.js [command] [options]
 */

const fs = require('fs');
const path = require('path');

const membersDBPath = path.join(__dirname, 'data', 'members.json');
const bookingsDBPath = path.join(__dirname, 'data', 'bookings.json');

// Read/Write helpers
function readMembers() {
    if (!fs.existsSync(membersDBPath)) return [];
    return JSON.parse(fs.readFileSync(membersDBPath, 'utf8'));
}

function writeMembers(data) {
    fs.writeFileSync(membersDBPath, JSON.stringify(data, null, 2));
}

function readBookings() {
    if (!fs.existsSync(bookingsDBPath)) return [];
    return JSON.parse(fs.readFileSync(bookingsDBPath, 'utf8'));
}

// Commands
const commands = {
    'list-members': {
        description: 'List all members',
        execute: () => {
            const members = readMembers();
            if (members.length === 0) {
                console.log('No members found.');
                return;
            }
            console.log('\n📋 Members List:');
            console.log('─'.repeat(80));
            members.forEach((m, i) => {
                console.log(`${i + 1}. ${m.fullName} (${m.email})`);
                console.log(`   Plan: ${m.plan} | Status: ${m.status}`);
                console.log(`   Joined: ${new Date(m.createdAt).toLocaleDateString()}`);
                console.log(`   Bookings: ${m.totalBookings || 0} | Savings: ₹${m.totalSavings || 0}`);
                console.log('');
            });
            console.log('─'.repeat(80));
            console.log(`Total members: ${members.length}`);
        }
    },

    'list-bookings': {
        description: 'List all bookings',
        execute: () => {
            const bookings = readBookings();
            if (bookings.length === 0) {
                console.log('No bookings found.');
                return;
            }
            console.log('\n📅 Bookings List:');
            console.log('─'.repeat(100));
            bookings.forEach((b, i) => {
                console.log(`${i + 1}. ${b.groundName} - ${b.bookingDate}`);
                console.log(`   Email: ${b.email} | Time: ${b.timeSlot}`);
                console.log(`   Price: ₹${b.originalPrice} | Discount: ₹${b.discount} | Final: ₹${b.finalPrice}`);
                console.log(`   Status: ${b.status}`);
                console.log('');
            });
            console.log('─'.repeat(100));
            console.log(`Total bookings: ${bookings.length}`);
        }
    },

    'stats': {
        description: 'Show system statistics',
        execute: () => {
            const members = readMembers();
            const bookings = readBookings();

            const activeMembers = members.filter(m => m.status === 'active').length;
            const monthlyMembers = members.filter(m => m.plan === 'monthly').length;
            const yearlyMembers = members.filter(m => m.plan === 'yearly').length;
            const totalSavings = members.reduce((sum, m) => sum + (m.totalSavings || 0), 0);
            const totalBookings = bookings.length;

            console.log('\n📊 System Statistics:');
            console.log('─'.repeat(50));
            console.log(`Total Members: ${members.length}`);
            console.log(`Active Members: ${activeMembers}`);
            console.log(`Monthly Plans: ${monthlyMembers}`);
            console.log(`Yearly Plans: ${yearlyMembers}`);
            console.log(`Total Bookings: ${totalBookings}`);
            console.log(`Total Member Savings: ₹${totalSavings}`);
            console.log(`Avg Bookings/Member: ${(totalBookings / Math.max(members.length, 1)).toFixed(1)}`);
            console.log('─'.repeat(50));
        }
    },

    'member-info': {
        description: 'Show member details (usage: member-info <email>)',
        execute: (email) => {
            if (!email) {
                console.log('Please provide email: member-info user@example.com');
                return;
            }
            const members = readMembers();
            const member = members.find(m => m.email === email);

            if (!member) {
                console.log(`Member not found: ${email}`);
                return;
            }

            console.log('\n👤 Member Information:');
            console.log('─'.repeat(50));
            console.log(`ID: ${member.id}`);
            console.log(`Name: ${member.fullName}`);
            console.log(`Email: ${member.email}`);
            console.log(`Phone: ${member.phone}`);
            console.log(`Plan: ${member.plan}`);
            console.log(`Status: ${member.status}`);
            console.log(`Discount: ${member.discountPercentage}%`);
            console.log(`Joined: ${new Date(member.createdAt).toLocaleDateString()}`);
            console.log(`Renewal Date: ${new Date(member.renewalDate).toLocaleDateString()}`);
            console.log(`Total Bookings: ${member.totalBookings || 0}`);
            console.log(`Total Savings: ₹${member.totalSavings || 0}`);
            console.log('─'.repeat(50));
        }
    },

    'member-bookings': {
        description: 'Show bookings for a member (usage: member-bookings <email>)',
        execute: (email) => {
            if (!email) {
                console.log('Please provide email: member-bookings user@example.com');
                return;
            }
            const bookings = readBookings();
            const memberBookings = bookings.filter(b => b.email === email);

            if (memberBookings.length === 0) {
                console.log(`No bookings found for: ${email}`);
                return;
            }

            console.log(`\n📅 Bookings for ${email}:`);
            console.log('─'.repeat(80));
            memberBookings.forEach((b, i) => {
                console.log(`${i + 1}. ${b.groundName} - ${b.bookingDate}`);
                console.log(`   Time: ${b.timeSlot} | Price: ₹${b.finalPrice}`);
                console.log(`   Status: ${b.status}`);
                console.log('');
            });
            console.log('─'.repeat(80));
            console.log(`Total: ${memberBookings.length} bookings`);
        }
    },

    'remove-member': {
        description: 'Remove a member (usage: remove-member <email>)',
        execute: (email) => {
            if (!email) {
                console.log('Please provide email: remove-member user@example.com');
                return;
            }
            let members = readMembers();
            const initialCount = members.length;
            members = members.filter(m => m.email !== email);

            if (members.length === initialCount) {
                console.log(`Member not found: ${email}`);
                return;
            }

            writeMembers(members);
            console.log(`✓ Member removed: ${email}`);
        }
    },

    'export-members': {
        description: 'Export members to CSV',
        execute: () => {
            const members = readMembers();
            let csv = 'Email,Name,Plan,Status,Bookings,Savings,Joined\n';
            csv += members.map(m => 
                `${m.email},"${m.fullName}",${m.plan},${m.status},${m.totalBookings || 0},${m.totalSavings || 0},"${new Date(m.createdAt).toLocaleDateString()}"`
            ).join('\n');

            const filename = path.join(__dirname, 'members-export.csv');
            fs.writeFileSync(filename, csv);
            console.log(`✓ Exported to: ${filename}`);
        }
    },

    'export-bookings': {
        description: 'Export bookings to CSV',
        execute: () => {
            const bookings = readBookings();
            let csv = 'Email,Ground,Date,Time,Price,Discount,Status\n';
            csv += bookings.map(b => 
                `${b.email},"${b.groundName}",${b.bookingDate},${b.timeSlot},₹${b.originalPrice},₹${b.discount},${b.status}`
            ).join('\n');

            const filename = path.join(__dirname, 'bookings-export.csv');
            fs.writeFileSync(filename, csv);
            console.log(`✓ Exported to: ${filename}`);
        }
    },

    'clear-data': {
        description: 'Clear all data (WARNING: This cannot be undone)',
        execute: () => {
            const confirm = process.argv[3];
            if (confirm !== '--yes') {
                console.log('⚠️  This will delete all data!');
                console.log('Run with --yes to confirm: clear-data --yes');
                return;
            }
            writeMembers([]);
            require('fs').writeFileSync(bookingsDBPath, JSON.stringify([]));
            console.log('✓ All data cleared');
        }
    },

    'help': {
        description: 'Show help',
        execute: () => {
            console.log('\n🎯 Membership Admin CLI\n');
            console.log('Usage: node admin-cli.js [command] [options]\n');
            console.log('Available commands:');
            Object.entries(commands).forEach(([cmd, info]) => {
                console.log(`  ${cmd.padEnd(20)} - ${info.description}`);
            });
            console.log('\nExamples:');
            console.log('  node admin-cli.js list-members');
            console.log('  node admin-cli.js stats');
            console.log('  node admin-cli.js member-info john@example.com');
            console.log('  node admin-cli.js export-members');
        }
    }
};

// Main
const command = process.argv[2] || 'help';
const option = process.argv[3];

if (commands[command]) {
    commands[command].execute(option);
} else {
    console.log(`❌ Unknown command: ${command}`);
    commands.help.execute();
}
