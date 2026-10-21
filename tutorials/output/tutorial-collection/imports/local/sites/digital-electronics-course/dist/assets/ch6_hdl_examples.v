// Original companion examples. Verilog-2001.
// Ideal RTL: physical timing, metastability and device-specific requirements
// must be checked separately in the implementation flow.

module dff_sync_reset(input clk, reset_n, d, output reg q);
  always @(posedge clk)
    if (!reset_n) q <= 1'b0;
    else q <= d;
endmodule

module dff_async_reset(input clk, reset_n, d, output reg q);
  always @(posedge clk or negedge reset_n)
    if (!reset_n) q <= 1'b0;
    else q <= d;
endmodule

// Textbook physical RIGHT shift is Q0 -> Q1 -> Q2 -> Q3.
// This corresponds to numerical left shift for q[3:0].
module shift194_model(
  input clk, reset_n, dir, dil,
  input [1:0] mode,
  input [3:0] d,
  output reg [3:0] q
);
  always @(posedge clk or negedge reset_n)
    if (!reset_n) q <= 4'b0000;
    else case (mode)
      2'b00: q <= q;
      2'b01: q <= {q[2:0], dir};
      2'b10: q <= {dil, q[3:1]};
      2'b11: q <= d;
      default: q <= q;
    endcase
endmodule

module counter13(
  input clk, reset_n, en,
  output reg [3:0] q,
  output terminal
);
  always @(posedge clk or negedge reset_n)
    if (!reset_n) q <= 4'd0;
    else if (en) begin
      if (q >= 4'd12) q <= 4'd0;
      else q <= q + 4'd1;
    end
  assign terminal = (q == 4'd12);
endmodule

module detect101(
  input clk, reset_n, x,
  output y,
  output reg hit
);
  localparam S0=2'b00, S1=2'b01, S2=2'b10;
  reg [1:0] state, next;
  always @(posedge clk or negedge reset_n)
    if (!reset_n) begin
      state <= S0;
      hit <= 1'b0;
    end else begin
      state <= next;
      hit <= (state == S2) & x;
    end
  always @* begin
    next = S0;
    case (state)
      S0: if (x) next = S1;
      S1: if (x) next = S1; else next = S2;
      S2: if (x) next = S1;
      default: next = S0;
    endcase
  end
  // y is combinational Mealy output. hit captures pre-edge y for one cycle.
  assign y = (state == S2) & x;
endmodule
