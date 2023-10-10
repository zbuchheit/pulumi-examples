import * as pulumi from "@pulumi/pulumi";
import * as pd from "@pulumi/pagerduty";
    
const pdUsersData = [{
    name: "User One",
    email: "fakeEmail1@example.com",
    role: "admin",
},{
    name: "User Two",
    email: "fakeEmail2@example.com",
    role: "user",
}, {
    name: "User Three",
    email: "fakeEmail3@example.com",
    role: "admin",
}, {
    name: "User Four",
    email: "fakeEmail4@example.com",
    role: "user",
}, {
    name: "User Five",
    email: "fakeEmail5@example.com",
    role: "user",
}, {
    name: "User Six",
    email: "fakeEmail6@example.com",
    role: "user",
}
];

//Create PagerDuty Users
const pdUsers = pdUsersData.map((user, index) => {
        return new pd.User(`user-${index+1}`, user);
    });

const pdTeamsData = [{
    name: "Team One",
    description: "Team One",
    members: [pdUsers[0], pdUsers[1]],
}, {
    name: "Team Two",
    description: "Team Two",
    members: [pdUsers[2], pdUsers[3]],
}, {
    name: "Team Three",
    description: "Team Three",
    members: [pdUsers[4], pdUsers[5]],
}]
const pdTeams = pdTeamsData.map((team, index) => {
    return {team: new pd.Team(`team-${index}`, team), members: team.members};
});

pdTeams.forEach((team, indexTeam) => {
    team.members.forEach((user, indexUser) => {
        user.role.apply(role => {
        new pd.TeamMembership(`teamMembership-team-${indexTeam+1}-user-${indexUser+1}`, {
            teamId: team.team.id,
            userId: user.id,
            role: role === "admin" ? "manager": "responder",
        });
    });
    });
});

const schedule = new pd.Schedule("schedule", {
    name: "My Important Schedule",
    description: "My Important Schedule",
    timeZone: "Etc/UTC",
    layers: [{
        name: "My Important Schedule Layer",
        start: "2021-01-01T00:00:00Z",
        rotationVirtualStart: "2021-01-01T00:00:00Z",
        rotationTurnLengthSeconds: 604800, // 1 week in seconds
        users: [pdUsers[2].id,pdUsers[3].id] // User Three and User Four (note: this will also add them to Team 1 via the escalation policy)
    }],
});
/*
Below results in unexpected behvaior in my opinion. 
User 3, 4, 5, and 6 are not members of Team 1, 
but when added to the escalation policy and the escalation policy is applied, 
they are added to Team 1 as managers. In order to remedy this,
you can either add the user to the team with the explicit membership you expect,
or create separate schedules and escalation policies per team.
 */
new pd.EscalationPolicy("escalation-policy", {
    name: "My Important Escalation Policy",
    rules: [{
        escalationDelayInMinutes: 30,
        targets: [{
            id: pdUsers[4].id, // User Five
            type: "user_reference",
        }, {
            id: pdUsers[5].id, // User Six
            type: "user_reference"
        }, {
            id: schedule.id,
            type: "schedule_reference",
        }],
    }],
    teams: pdTeams[0].team.id // Team One
}, {
    aliases: [{parent: pulumi.rootStackResource, name: "escalationPolicy"}]
});
