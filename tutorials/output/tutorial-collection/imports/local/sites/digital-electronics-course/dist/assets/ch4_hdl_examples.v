// Original teaching implementations accompanying Chapter 4.
// Combinational models; physical timing is not certified.

module mux2(input a, b, sel, output out, outbar);
  assign out = sel ? a : b;
  assign outbar = ~out;
endmodule

module mux2_struct(input a,b,sel, output out,outbar);
  wire ns,pa,pb;
  not n1(ns,sel);
  and a1(pa,a,sel), a2(pb,b,ns);
  or o1(out,pa,pb);
  not n2(outbar,out);
endmodule

module fa(input a,b,ci, output s,co);
  wire p,ab,ac,bc;
  xor x1(p,a,b), x2(s,p,ci);
  and g1(ab,a,b), g2(ac,a,ci), g3(bc,b,ci);
  or g4(co,ab,ac,bc);
endmodule
module adder4_struct(input [3:0] a,b, input ci,
                     output [3:0] s, output co);
  wire [4:0] c;
  assign c[0]=ci;
  assign co=c[4];
  fa u0(.a(a[0]),.b(b[0]),.ci(c[0]),.s(s[0]),.co(c[1]));
  fa u1(.a(a[1]),.b(b[1]),.ci(c[1]),.s(s[1]),.co(c[2]));
  fa u2(.a(a[2]),.b(b[2]),.ci(c[2]),.s(s[2]),.co(c[3]));
  fa u3(.a(a[3]),.b(b[3]),.ci(c[3]),.s(s[3]),.co(c[4]));
endmodule

module adder4_behavior(input [3:0] a,b, input ci,
                       output [3:0] s, output co);
  assign {co,s}={1'b0,a}+{1'b0,b}+{4'b0000,ci};
endmodule

module level_encode(input [8:0] sensor, output reg [3:0] f);
  always @* begin
    case (sensor)
      9'b000000001: f=4'd1;
      9'b000000011: f=4'd2;
      9'b000000111: f=4'd3;
      9'b000001111: f=4'd4;
      9'b000011111: f=4'd5;
      9'b000111111: f=4'd6;
      9'b001111111: f=4'd7;
      9'b011111111: f=4'd8;
      9'b111111111: f=4'd9;
      default: f=4'bxxxx;
    endcase
  end
endmodule
module seven_segment(input [3:0] f, output reg [6:0] y);
  // y[6:0] = g f e d c b a; textbook glyphs for 6 and 9
  always @* begin
    case (f)
      4'd0: y=7'b0111111;
      4'd1: y=7'b0000110;
      4'd2: y=7'b1011011;
      4'd3: y=7'b1001111;
      4'd4: y=7'b1100110;
      4'd5: y=7'b1101101;
      4'd6: y=7'b1111100;
      4'd7: y=7'b0000111;
      4'd8: y=7'b1111111;
      4'd9: y=7'b1100111;
      default: y=7'b0000000;
    endcase
  end
endmodule
module level_display(input [8:0] sensor, output [6:0] y, output alarm);
  wire [3:0] f;
  level_encode enc(.sensor(sensor),.f(f));
  seven_segment dec(.f(f),.y(y));
  assign alarm=sensor[8];
endmodule

module binary_to_gray(input [3:0] b, output [3:0] g);
  assign g={b[3], b[3]^b[2], b[2]^b[1], b[1]^b[0]};
endmodule

module mux4_behavior(input [3:0] data, input [1:0] sel,
                     output reg out, output outbar);
  always @* begin
    case (sel)
      2'b00: out=data[0];
      2'b01: out=data[1];
      2'b10: out=data[2];
      2'b11: out=data[3];
      default: out=1'bx;
    endcase
  end
  assign outbar=~out;
endmodule

module cla4(input [3:0] a,b, input ci, output [3:0] s, output co);
  wire [3:0] p,g;
  wire [4:0] c;
  assign p=a|b;
  assign g=a&b;
  assign c[0]=ci;
  assign c[1]=g[0]|(p[0]&ci);
  assign c[2]=g[1]|(p[1]&g[0])|(p[1]&p[0]&ci);
  assign c[3]=g[2]|(p[2]&g[1])|(p[2]&p[1]&g[0])
                    |(p[2]&p[1]&p[0]&ci);
  assign c[4]=g[3]|(p[3]&g[2])|(p[3]&p[2]&g[1])
                    |(p[3]&p[2]&p[1]&g[0])
                    |(p[3]&p[2]&p[1]&p[0]&ci);
  assign s=a^b^c[3:0];
  assign co=c[4];
endmodule

module binary_to_eseg(input A,B,C,D, output eSeg);
  wire p1,p2,p3,p4;
  nand g1(p1,C,~D), g2(p2,A,B),
       g3(p3,~B,~D), g4(p4,A,C),
       g5(eSeg,p1,p2,p3,p4);
endmodule
