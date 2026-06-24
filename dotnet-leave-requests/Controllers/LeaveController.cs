using Microsoft.AspNetCore.Mvc;
using NativeBPM.Client.Api;
using NativeBPM.Client.Client;
using NativeBPM.Client.Model;
using System;
using System.Collections.Generic;

namespace LeaveRequests.Controllers
{
    [ApiController]
    [Route("api/leaves")]
    public class LeaveController : ControllerBase
    {
        private readonly DefaultApi _bpmApi;

        public LeaveController()
        {
            // 1. Initialize API configuration from the SDK
            var config = new Configuration
            {
                BasePath = "http://localhost:8080",
                AccessToken = "awesome-token"
            };
            _bpmApi = new DefaultApi(config);
        }

        [HttpPost]
        public IActionResult CreateLeaveRequest([FromBody] LeaveRequestDto requestDto)
        {
            var leaveId = Guid.NewGuid().ToString();
            var response = new Dictionary<string, object>
            {
                { "leaveId", leaveId }
            };

            try
            {
                // 2. Build start request and invoke workflow process
                var startRequest = new StartInstanceRequest(
                    businessKey: leaveId,
                    variables: new Dictionary<string, object>
                    {
                        { "leaveId", leaveId },
                        { "employeeName", requestDto.EmployeeName },
                        { "daysCount", requestDto.DaysCount }
                    }
                );

                var instance = _bpmApi.StartInstance("leave-approval-flow", startRequest);
                
                response.Add("instanceId", instance.Id);
                response.Add("status", "SUBMITTED");
                return Ok(response);
            }
            catch (Exception)
            {
                // Fallback simulation when engine is offline
                response.Add("status", "PENDING_LOCAL_REVIEW");
                response.Add("message", "Simulated locally (engine offline)");
                return Accepted(response);
            }
        }
    }

    public class LeaveRequestDto
    {
        public string EmployeeName { get; set; } = string.Empty;
        public int DaysCount { get; set; }
    }
}
